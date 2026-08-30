const crypto = require('crypto');
const Integration = require('../models/Integration');
const env = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(env.CREDENTIAL_ENCRYPTION_KEY || 'default-secret-key-32-chars-long!', 'salt', 32);

// Encrypt plain credentials object to string
const encryptCredentials = (credentialsObj) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(JSON.stringify(credentialsObj), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

// Decrypt stored credential string back to object
const decryptCredentials = (encryptedString) => {
  const [ivHex, authTagHex, encryptedText] = encryptedString.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

const saveIntegration = async (ownerId, provider, credentials, metadata = {}) => {
  const encryptedCredentials = encryptCredentials(credentials);
  const integration = await Integration.findOneAndUpdate(
    { owner: ownerId, provider },
    {
      owner: ownerId,
      provider,
      encryptedCredentials,
      isConnected: true,
      metadata
    },
    { upsert: true, new: true }
  );
  return integration;
};

const getUserIntegrations = async (ownerId) => {
  const integrations = await Integration.find({ owner: ownerId }).select('-encryptedCredentials');
  return integrations;
};

const getDecryptedIntegration = async (ownerId, provider) => {
  const integration = await Integration.findOne({ owner: ownerId, provider });
  if (!integration || !integration.isConnected) return null;
  const credentials = decryptCredentials(integration.encryptedCredentials);
  return { ...integration.toObject(), credentials };
};

const deleteIntegration = async (ownerId, provider) => {
  return await Integration.findOneAndDelete({ owner: ownerId, provider });
};

module.exports = {
  saveIntegration,
  getUserIntegrations,
  getDecryptedIntegration,
  deleteIntegration
};