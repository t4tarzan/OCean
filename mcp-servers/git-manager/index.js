#!/usr/bin/env node

/**
 * Git Manager MCP Server
 * ======================
 * 
 * Intelligent Git management with AI-powered features:
 * - Smart branching with team naming conventions
 * - AI-generated commit messages
 * - Automated PR creation with descriptions
 * - Conflict detection and resolution suggestions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import simpleGit from 'simple-git';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client for AI features
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_URL
});

// MCP Server setup
const server = new Server(
  {
    name: 'git-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'smart_branch',
      description: 'Create a new branch with team naming conventions (feature/, bugfix/, hotfix/)',
      inputSchema: {
        type: 'object',
        properties: {
          featureName: {
            type: 'string',
            description: 'Name of the feature (will be kebab-cased)'
          },
          branchType: {
            type: 'string',
            enum: ['feature', 'bugfix', 'hotfix'],
            description: 'Type of branch to create'
          },
          projectPath: {
            type: 'string',
            description: 'Path to the Git repository'
          }
        },
        required: ['featureName', 'branchType', 'projectPath']
      }
    },
    {
      name: 'smart_commit',
      description: 'Generate AI-powered commit message from staged changes',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Git repository'
          },
          context: {
            type: 'string',
            description: 'Optional context about the changes'
          }
        },
        required: ['projectPath']
      }
    },
    {
      name: 'smart_pr',
      description: 'Generate AI-powered PR title and description from branch changes',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Git repository'
          },
          targetBranch: {
            type: 'string',
            description: 'Target branch for PR (default: main)'
          }
        },
        required: ['projectPath']
      }
    },
    {
      name: 'detect_conflicts',
      description: 'Detect merge conflicts and suggest resolutions',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Git repository'
          },
          sourceBranch: {
            type: 'string',
            description: 'Source branch'
          },
          targetBranch: {
            type: 'string',
            description: 'Target branch'
          }
        },
        required: ['projectPath', 'sourceBranch', 'targetBranch']
      }
    },
    {
      name: 'git_status',
      description: 'Get current Git status with AI insights',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the Git repository'
          }
        },
        required: ['projectPath']
      }
    }
  ]
}));

// Tool implementations
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'smart_branch':
        return await smartBranch(args.featureName, args.branchType, args.projectPath);
      
      case 'smart_commit':
        return await smartCommit(args.projectPath, args.context);
      
      case 'smart_pr':
        return await smartPR(args.projectPath, args.targetBranch || 'main');
      
      case 'detect_conflicts':
        return await detectConflicts(args.projectPath, args.sourceBranch, args.targetBranch);
      
      case 'git_status':
        return await gitStatus(args.projectPath);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Smart branching with naming conventions
async function smartBranch(featureName, branchType, projectPath) {
  const git = simpleGit(projectPath);
  
  // Convert to kebab-case
  const kebabName = featureName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const branchName = `${branchType}/${kebabName}`;
  
  // Check if branch exists
  const branches = await git.branch();
  if (branches.all.includes(branchName)) {
    throw new Error(`Branch ${branchName} already exists`);
  }
  
  // Create and checkout branch
  await git.checkoutLocalBranch(branchName);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Created and checked out branch: ${branchName}`
      }
    ]
  };
}

// AI-generated commit message
async function smartCommit(projectPath, context = '') {
  const git = simpleGit(projectPath);
  
  // Get diff of staged changes
  const diff = await git.diff(['--cached']);
  
  if (!diff) {
    throw new Error('No staged changes to commit');
  }
  
  // Generate commit message using Claude
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Generate a concise, conventional commit message for these changes. Follow format: <type>: <description>

Types: feat, fix, docs, style, refactor, test, chore

Context: ${context || 'None provided'}

Diff:
${diff.substring(0, 4000)}

Return only the commit message, no explanation.`
    }]
  });
  
  const commitMessage = response.content[0].text.trim();
  
  // Commit with generated message
  await git.commit(commitMessage);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Committed with message:\n${commitMessage}`
      }
    ]
  };
}

// AI-generated PR description
async function smartPR(projectPath, targetBranch) {
  const git = simpleGit(projectPath);
  
  // Get current branch
  const status = await git.status();
  const currentBranch = status.current;
  
  // Get commits between branches
  const log = await git.log([`${targetBranch}..${currentBranch}`]);
  
  if (log.total === 0) {
    throw new Error('No commits to create PR from');
  }
  
  // Get diff
  const diff = await git.diff([targetBranch, currentBranch]);
  
  // Generate PR description using Claude
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Generate a PR title and description for these changes.

Branch: ${currentBranch} → ${targetBranch}

Commits:
${log.all.map(c => `- ${c.message}`).join('\n')}

Diff summary:
${diff.substring(0, 3000)}

Format:
Title: <concise title>

Description:
## What
<what changed>

## Why
<why it changed>

## Testing
<how to test>`
    }]
  });
  
  const prContent = response.content[0].text.trim();
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ PR Content Generated:\n\n${prContent}\n\nBranch: ${currentBranch} → ${targetBranch}`
      }
    ]
  };
}

// Conflict detection
async function detectConflicts(projectPath, sourceBranch, targetBranch) {
  const git = simpleGit(projectPath);
  
  try {
    // Try merge with no-commit to detect conflicts
    await git.raw(['merge', '--no-commit', '--no-ff', sourceBranch]);
    
    // No conflicts
    await git.raw(['merge', '--abort']);
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ No conflicts detected between ${sourceBranch} and ${targetBranch}`
        }
      ]
    };
  } catch (error) {
    // Conflicts detected
    const status = await git.status();
    const conflicts = status.conflicted;
    
    if (conflicts.length === 0) {
      throw error; // Different error
    }
    
    // Get conflict details
    const conflictDetails = await Promise.all(
      conflicts.map(async (file) => {
        const content = await git.show([`HEAD:${file}`]).catch(() => 'File not in HEAD');
        return { file, preview: content.substring(0, 200) };
      })
    );
    
    // Generate resolution suggestions using Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Suggest resolutions for these merge conflicts:

Conflicts in files:
${conflicts.join('\n')}

Provide step-by-step resolution guidance.`
      }]
    });
    
    const suggestions = response.content[0].text.trim();
    
    // Abort the merge
    await git.raw(['merge', '--abort']);
    
    return {
      content: [
        {
          type: 'text',
          text: `⚠️  Conflicts detected in ${conflicts.length} file(s):\n${conflicts.join('\n')}\n\n${suggestions}`
        }
      ]
    };
  }
}

// Git status with insights
async function gitStatus(projectPath) {
  const git = simpleGit(projectPath);
  
  const status = await git.status();
  const log = await git.log({ maxCount: 5 });
  
  const statusText = `
📊 Git Status

Branch: ${status.current}
Ahead: ${status.ahead} | Behind: ${status.behind}

Modified: ${status.modified.length}
Staged: ${status.staged.length}
Untracked: ${status.not_added.length}

Recent commits:
${log.all.map(c => `- ${c.message} (${c.date})`).join('\n')}
  `.trim();
  
  return {
    content: [
      {
        type: 'text',
        text: statusText
      }
    ]
  };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Git Manager MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
