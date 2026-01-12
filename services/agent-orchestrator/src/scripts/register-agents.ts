import { 
  ArchitectAgent, 
  DatabaseAgent, 
  APIAgent, 
  FrontendAgent, 
  QAAgent, 
  SecurityAgent, 
  IntegratorAgent 
} from '../agents';
import messageBus from '../messaging/redis-bus';

async function registerAllAgents() {
  console.log('🚀 Starting agent registration...\n');

  try {
    // Connect to Redis message bus
    await messageBus.connect();
    console.log('✅ Redis message bus connected\n');

    // Initialize all 7 agents
    console.log('📝 Registering agents...\n');

    const architectAgent = new ArchitectAgent();
    await architectAgent.register();
    console.log('✅ Architect Agent registered:', architectAgent.getId());

    const databaseAgent = new DatabaseAgent();
    await databaseAgent.register();
    console.log('✅ Database Agent registered:', databaseAgent.getId());

    const apiAgent = new APIAgent();
    await apiAgent.register();
    console.log('✅ API Agent registered:', apiAgent.getId());

    const frontendAgent = new FrontendAgent();
    await frontendAgent.register();
    console.log('✅ Frontend Agent registered:', frontendAgent.getId());

    const qaAgent = new QAAgent();
    await qaAgent.register();
    console.log('✅ QA Agent registered:', qaAgent.getId());

    const securityAgent = new SecurityAgent();
    await securityAgent.register();
    console.log('✅ Security Agent registered:', securityAgent.getId());

    const integratorAgent = new IntegratorAgent();
    await integratorAgent.register();
    console.log('✅ Integrator Agent registered:', integratorAgent.getId());

    console.log('\n🎉 All 7 agents successfully registered!');
    console.log('\nAgent Summary:');
    console.log('- Architect Agent (Claude Opus): System design, tech stack selection');
    console.log('- Database Agent (Claude Sonnet): Schema generation, migrations');
    console.log('- API Agent (Claude Sonnet): Endpoint creation, validation');
    console.log('- Frontend Agent (Claude Sonnet): Component generation, UI');
    console.log('- QA Agent (Claude Haiku): Test generation, auto-fix');
    console.log('- Security Agent (Claude Sonnet): Vulnerability scanning');
    console.log('- Integrator Agent (Claude Sonnet): Code merging, integration');

    // Keep agents alive for a moment to ensure registration completes
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n✅ Registration complete. Agents are now active and listening for tasks.');
    
    // Don't exit - keep agents running
    console.log('\n⏳ Agents running... Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Error during agent registration:', error);
    process.exit(1);
  }
}

// Run registration
registerAllAgents();
