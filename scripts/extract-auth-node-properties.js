/**
 * Utility script to extract authentication node properties
 * This shows how to programmatically access node properties for testing
 * 
 * Usage: node scripts/extract-auth-node-properties.js
 */

// Example: How node properties are structured in the codebase
// This is a reference implementation showing property access patterns

/**
 * Get all authentication node types and their properties
 * In actual codebase, this would import from nodeTypes.ts
 */
function getAuthNodeProperties() {
  // In real implementation, you would:
  // import { NODE_TYPES } from '../src/components/workflow/nodeTypes.ts';
  // const authNodes = NODE_TYPES.filter(node => node.category === 'authentication');
  
  // For reference, here's how you would access them:
  const authNodeTypes = ['oauth2', 'jwt', 'ldap', 'okta', 'auth0', 'keycloak'];
  
  return authNodeTypes.map(type => {
    return {
      type,
      // Properties would come from nodeTypes.ts configFields
    };
  });
}

/**
 * Example: How to access node properties during execution
 * This matches the pattern used in execute-workflow/index.ts
 */
function accessNodeProperties(node) {
  // Node structure:
  // {
  //   id: "node-1",
  //   type: "oauth2",
  //   data: {
  //     label: "OAuth2",
  //     type: "oauth2",
  //     category: "authentication",
  //     config: {
  //       operation: "get_access_token",
  //       clientId: "your-client-id",
  //       // ... other properties
  //     }
  //   }
  // }
  
  const config = node.data.config;
  
  // Access string properties
  const operation = config.operation;
  const clientId = config.clientId;
  
  // Access number properties
  const limit = config.limit || 200;
  
  // Access JSON properties (may need parsing)
  let userData;
  if (config.userData) {
    userData = typeof config.userData === 'string' 
      ? JSON.parse(config.userData)
      : config.userData;
  }
  
  return {
    operation,
    clientId,
    limit,
    userData,
  };
}

/**
 * Helper function to safely get string property (from execute-workflow/index.ts)
 */
function getStringProperty(obj, key, defaultValue = '') {
  const value = obj[key];
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
}

/**
 * Helper function to safely get number property (from execute-workflow/index.ts)
 */
function getNumberProperty(obj, key, defaultValue = 0) {
  const value = obj[key];
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
}

/**
 * Helper function to safely get boolean property
 */
function getBooleanProperty(obj, key, defaultValue = false) {
  const value = obj[key];
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
}

/**
 * Example: Extract OAuth2 node properties
 */
function extractOAuth2Properties(config) {
  return {
    operation: getStringProperty(config, 'operation', 'get_access_token'),
    grantType: getStringProperty(config, 'grantType', 'authorization_code'),
    clientId: getStringProperty(config, 'clientId', ''),
    clientSecret: getStringProperty(config, 'clientSecret', ''),
    tokenUrl: getStringProperty(config, 'tokenUrl', ''),
    authorizationUrl: getStringProperty(config, 'authorizationUrl', ''),
    redirectUri: getStringProperty(config, 'redirectUri', ''),
    code: getStringProperty(config, 'code', ''),
    refreshToken: getStringProperty(config, 'refreshToken', ''),
    scope: getStringProperty(config, 'scope', ''),
  };
}

/**
 * Example: Extract JWT node properties
 */
function extractJWTProperties(config) {
  let payload;
  if (config.payload) {
    payload = typeof config.payload === 'string'
      ? JSON.parse(config.payload)
      : config.payload;
  }
  
  return {
    operation: getStringProperty(config, 'operation', 'sign'),
    algorithm: getStringProperty(config, 'algorithm', 'HS256'),
    secret: getStringProperty(config, 'secret', ''),
    payload: payload,
    token: getStringProperty(config, 'token', ''),
    expiresIn: getStringProperty(config, 'expiresIn', ''),
  };
}

/**
 * Example: Extract Okta node properties
 */
function extractOktaProperties(config) {
  let userData;
  if (config.userData) {
    userData = typeof config.userData === 'string'
      ? JSON.parse(config.userData)
      : config.userData;
  }
  
  return {
    operation: getStringProperty(config, 'operation', 'get_user'),
    domain: getStringProperty(config, 'domain', ''),
    apiToken: getStringProperty(config, 'apiToken', ''),
    userId: getStringProperty(config, 'userId', ''),
    userData: userData,
    query: getStringProperty(config, 'query', ''),
    limit: getNumberProperty(config, 'limit', 200),
  };
}

/**
 * Create a test node configuration object
 */
function createTestNode(type, config) {
  return {
    id: `test-${type}-${Date.now()}`,
    type: type,
    data: {
      label: type.charAt(0).toUpperCase() + type.slice(1),
      type: type,
      category: 'authentication',
      config: config,
    },
  };
}

/**
 * Example usage for testing
 */
// Check if this file is being run directly (ES module equivalent of require.main === module)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && process.argv[1].endsWith('extract-auth-node-properties.js');

if (isMainModule) {
  console.log('=== Authentication Node Properties Extractor ===\n');
  
  // Example: Create a test OAuth2 node
  const oauth2Config = {
    operation: 'get_access_token',
    grantType: 'authorization_code',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    tokenUrl: 'https://oauth.example.com/token',
    authorizationUrl: 'https://oauth.example.com/authorize',
    redirectUri: 'https://yourapp.com/callback',
    code: 'test-code',
    scope: 'read write',
  };
  
  const oauth2Node = createTestNode('oauth2', oauth2Config);
  const extractedProps = extractOAuth2Properties(oauth2Node.data.config);
  
  console.log('OAuth2 Node Test Configuration:');
  console.log(JSON.stringify(extractedProps, null, 2));
  
  console.log('\n---\n');
  
  // Example: Create a test JWT node
  const jwtConfig = {
    operation: 'sign',
    algorithm: 'HS256',
    secret: 'test-secret',
    payload: JSON.stringify({
      sub: 'user123',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }),
    expiresIn: '1h',
  };
  
  const jwtNode = createTestNode('jwt', jwtConfig);
  const jwtProps = extractJWTProperties(jwtNode.data.config);
  
  console.log('JWT Node Test Configuration:');
  console.log(JSON.stringify(jwtProps, null, 2));
}

export {
  getStringProperty,
  getNumberProperty,
  getBooleanProperty,
  extractOAuth2Properties,
  extractJWTProperties,
  extractOktaProperties,
  createTestNode,
  accessNodeProperties,
};

