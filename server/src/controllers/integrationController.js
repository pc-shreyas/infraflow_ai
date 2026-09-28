const integrationService = require('../services/integrationService');
const githubDriver = require('../integrations/githubIntegration');
const awsDriver = require('../integrations/awsIntegration');
const dockerDriver = require('../integrations/dockerIntegration');
const digitaloceanDriver = require('../integrations/digitaloceanIntegration');
const vercelDriver = require('../integrations/vercelIntegration');

const drivers = {
  github: githubDriver,
  aws: awsDriver,
  docker: dockerDriver,
  digitalocean: digitaloceanDriver,
  vercel: vercelDriver,
};

exports.getIntegrations = async (req, res, next) => {
  try {
    const list = await integrationService.getUserIntegrations(req.user.id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

exports.saveIntegration = async (req, res, next) => {
  try {
    const { provider, credentials, metadata } = req.body;
    const driver = drivers[provider];
    
    if (driver) {
      const testResult = await driver.testConnection(credentials);
      if (!testResult.success) {
        return res.status(400).json({ success: false, message: `Credential verification failed: ${testResult.message}` });
      }
    }

    const saved = await integrationService.saveIntegration(req.user.id, provider, credentials, metadata);
    res.json({ success: true, message: `${provider} credentials encrypted and saved successfully.`, data: saved });
  } catch (err) {
    next(err);
  }
};

exports.deleteIntegration = async (req, res, next) => {
  try {
    const { provider } = req.params;
    await integrationService.deleteIntegration(req.user.id, provider);
    res.json({ success: true, message: `Disconnected ${provider} integration.` });
  } catch (err) {
    next(err);
  }
};