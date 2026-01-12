/**
 * Knowledge Graph Manager
 * =======================
 * 
 * Manages Neo4j knowledge graph for tracking technologies, patterns,
 * and relationships learned from team projects.
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { Pool } from 'pg';

export interface Technology {
  name: string;
  category: string;
  description?: string;
  popularity?: number;
}

export interface TechStack {
  [category: string]: string | null;
  framework: string | null;
  database: string | null;
  orm: string | null;
  styling: string | null;
  authentication: string | null;
}

export interface GraphVisualization {
  nodes: Array<{
    id: string;
    label: string;
    category: string;
    popularity: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: string;
    strength: number;
  }>;
}

export class KnowledgeGraphManager {
  private driver: Driver;
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
    this.driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
      )
    );
  }

  /**
   * Initialize knowledge graph schema
   */
  async initializeSchema(): Promise<void> {
    const session = this.driver.session();
    try {
      // Create constraints
      await session.run(`
        CREATE CONSTRAINT technology_name IF NOT EXISTS
        FOR (t:Technology) REQUIRE t.name IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT project_id IF NOT EXISTS
        FOR (p:Project) REQUIRE p.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT pattern_id IF NOT EXISTS
        FOR (p:Pattern) REQUIRE p.id IS UNIQUE
      `);

      // Create indexes
      await session.run(`
        CREATE INDEX technology_category IF NOT EXISTS
        FOR (t:Technology) ON (t.category)
      `);

      await session.run(`
        CREATE INDEX project_team IF NOT EXISTS
        FOR (p:Project) ON (p.teamId)
      `);

      console.log('✅ Knowledge graph schema initialized');
    } catch (error) {
      console.error('❌ Failed to initialize schema:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Add technology to knowledge graph
   */
  async addTechnology(tech: Technology): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MERGE (t:Technology {name: $name})
        SET t.category = $category,
            t.description = $description,
            t.popularity = $popularity,
            t.lastUsed = datetime()
      `, {
        name: tech.name,
        category: tech.category,
        description: tech.description || '',
        popularity: tech.popularity || 0.5
      });

      console.log(`✅ Added technology: ${tech.name}`);
    } catch (error) {
      console.error(`❌ Failed to add technology ${tech.name}:`, error);
    } finally {
      await session.close();
    }
  }

  /**
   * Add relationship between technologies
   */
  async addRelationship(
    from: string,
    to: string,
    type: string,
    strength: number = 1.0
  ): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (a:Technology {name: $from})
        MATCH (b:Technology {name: $to})
        MERGE (a)-[r:${type}]->(b)
        SET r.strength = $strength,
            r.timesObserved = COALESCE(r.timesObserved, 0) + 1,
            r.lastObserved = datetime()
      `, { from, to, strength });

      console.log(`✅ Added relationship: ${from} -[${type}]-> ${to}`);
    } catch (error) {
      console.error(`❌ Failed to add relationship:`, error);
    } finally {
      await session.close();
    }
  }

  /**
   * Add project to knowledge graph
   */
  async addProject(project: any): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MERGE (p:Project {id: $id})
        SET p.name = $name,
            p.teamId = $teamId,
            p.type = $type,
            p.status = $status,
            p.successRating = $successRating,
            p.createdAt = datetime($createdAt)
      `, {
        id: project.id,
        name: project.name,
        teamId: project.team_id,
        type: project.type || 'web',
        status: project.status,
        successRating: project.success_rating || 0.5,
        createdAt: project.created_at?.toISOString() || new Date().toISOString()
      });

      console.log(`✅ Added project: ${project.name}`);
    } catch (error) {
      console.error(`❌ Failed to add project:`, error);
    } finally {
      await session.close();
    }
  }

  /**
   * Link project to technologies
   */
  async linkProjectToTechnology(projectId: string, techName: string): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (p:Project {id: $projectId})
        MATCH (t:Technology {name: $techName})
        MERGE (p)-[r:USES]->(t)
        SET r.createdAt = datetime()
      `, { projectId, techName });
    } catch (error) {
      console.error(`❌ Failed to link project to technology:`, error);
    } finally {
      await session.close();
    }
  }

  /**
   * Infer relationships from team projects
   */
  async inferRelationships(teamId: string): Promise<void> {
    try {
      console.log(`🔍 Inferring relationships for team: ${teamId}`);

      // Get all completed team projects
      const projects = await this.db.query(`
        SELECT * FROM projects 
        WHERE team_id = $1 AND status = 'completed'
      `, [teamId]);

      for (const project of projects.rows) {
        // Add project to graph
        await this.addProject(project);

        // Get decisions for this project
        const decisions = await this.db.query(`
          SELECT * FROM decisions WHERE project_id = $1
        `, [project.id]);

        // Extract technologies from decisions
        const technologies = this.extractTechnologies(decisions.rows);

        // Add technologies to graph
        for (const tech of technologies) {
          await this.addTechnology(tech);
          await this.linkProjectToTechnology(project.id, tech.name);
        }

        // Infer WORKS_WITH relationships (technologies used together)
        for (let i = 0; i < technologies.length; i++) {
          for (let j = i + 1; j < technologies.length; j++) {
            await this.addRelationship(
              technologies[i].name,
              technologies[j].name,
              'WORKS_WITH',
              0.8
            );
          }
        }
      }

      console.log(`✅ Inferred relationships for ${projects.rows.length} projects`);
    } catch (error) {
      console.error('❌ Failed to infer relationships:', error);
      throw error;
    }
  }

  /**
   * Extract technologies from decisions
   */
  private extractTechnologies(decisions: any[]): Technology[] {
    const techKeywords = {
      'react': { category: 'framework', name: 'React' },
      'nextjs': { category: 'framework', name: 'Next.js' },
      'vue': { category: 'framework', name: 'Vue' },
      'angular': { category: 'framework', name: 'Angular' },
      'postgresql': { category: 'database', name: 'PostgreSQL' },
      'mongodb': { category: 'database', name: 'MongoDB' },
      'redis': { category: 'database', name: 'Redis' },
      'neo4j': { category: 'database', name: 'Neo4j' },
      'prisma': { category: 'orm', name: 'Prisma' },
      'typeorm': { category: 'orm', name: 'TypeORM' },
      'tailwind': { category: 'styling', name: 'Tailwind CSS' },
      'shadcn': { category: 'styling', name: 'shadcn/ui' },
      'auth0': { category: 'authentication', name: 'Auth0' },
      'clerk': { category: 'authentication', name: 'Clerk' }
    };

    const foundTechs = new Set<string>();
    const technologies: Technology[] = [];

    for (const decision of decisions) {
      const text = `${decision.decision} ${decision.reasoning}`.toLowerCase();
      
      for (const [keyword, tech] of Object.entries(techKeywords)) {
        if (text.includes(keyword) && !foundTechs.has(tech.name)) {
          foundTechs.add(tech.name);
          technologies.push(tech);
        }
      }
    }

    return technologies;
  }

  /**
   * Recommend tech stack based on team history
   */
  async recommendTechStack(projectType: string, teamId: string): Promise<TechStack> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (p:Project {teamId: $teamId, type: $projectType, status: 'completed'})
        MATCH (p)-[:USES]->(t:Technology)
        WITH t, COUNT(p) as usage, AVG(p.successRating) as avgRating
        WHERE usage >= 1
        RETURN t.name as technology,
               t.category as category,
               usage,
               avgRating
        ORDER BY avgRating DESC, usage DESC
      `, { teamId, projectType });

      const stack: TechStack = {
        framework: null,
        database: null,
        orm: null,
        styling: null,
        authentication: null
      };

      for (const record of result.records) {
        const category = record.get('category');
        const tech = record.get('technology');
        
        if (category && !stack[category]) {
          stack[category] = tech;
        }
      }

      console.log(`✅ Recommended tech stack for ${projectType}:`, stack);
      return stack;
    } catch (error) {
      console.error('❌ Failed to recommend tech stack:', error);
      return {
        framework: null,
        database: null,
        orm: null,
        styling: null,
        authentication: null
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Visualize knowledge graph for a team
   */
  async visualizeKnowledgeGraph(teamId: string): Promise<GraphVisualization> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (t:Technology)
        WHERE EXISTS((t)<-[:USES]-(:Project {teamId: $teamId}))
        OPTIONAL MATCH (t)-[r]->(other:Technology)
        WHERE EXISTS((other)<-[:USES]-(:Project {teamId: $teamId}))
        RETURN t, collect({rel: r, other: other}) as relationships
      `, { teamId });

      const nodes: GraphVisualization['nodes'] = [];
      const edges: GraphVisualization['edges'] = [];
      const seenNodes = new Set<string>();

      for (const record of result.records) {
        const tech = record.get('t').properties;
        
        if (!seenNodes.has(tech.name)) {
          nodes.push({
            id: tech.name,
            label: tech.name,
            category: tech.category,
            popularity: tech.popularity || 0.5
          });
          seenNodes.add(tech.name);
        }

        const relationships = record.get('relationships');
        for (const rel of relationships) {
          if (rel.rel && rel.other) {
            const other = rel.other.properties;
            const relationship = rel.rel.properties;

            if (!seenNodes.has(other.name)) {
              nodes.push({
                id: other.name,
                label: other.name,
                category: other.category,
                popularity: other.popularity || 0.5
              });
              seenNodes.add(other.name);
            }

            edges.push({
              from: tech.name,
              to: other.name,
              type: rel.rel.type,
              strength: relationship.strength || 1.0
            });
          }
        }
      }

      console.log(`✅ Visualized graph: ${nodes.length} nodes, ${edges.length} edges`);
      return { nodes, edges };
    } catch (error) {
      console.error('❌ Failed to visualize knowledge graph:', error);
      return { nodes: [], edges: [] };
    } finally {
      await session.close();
    }
  }

  /**
   * Close Neo4j driver
   */
  async close(): Promise<void> {
    await this.driver.close();
  }
}

// Singleton instance
let knowledgeGraphManagerInstance: KnowledgeGraphManager | null = null;

/**
 * Get or create singleton knowledge graph manager
 */
export function getKnowledgeGraphManager(db: Pool): KnowledgeGraphManager {
  if (!knowledgeGraphManagerInstance) {
    knowledgeGraphManagerInstance = new KnowledgeGraphManager(db);
  }
  return knowledgeGraphManagerInstance;
}
