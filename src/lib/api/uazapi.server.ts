export interface UazApiConfig {
  baseUrl: string
  adminToken: string
}

export const uazapi = {
  /**
   * Create a new instance
   * POST /instance/init (based on appjulia)
   */
  async createInstance(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/init`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'admintoken': config.adminToken,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        name: instanceName,
      }),
    })
    return res.json()
  },

  /**
   * Set webhook for an instance
   * POST /webhook
   * Requires 'token' header (instance token)
   */
  async setWebhook(config: UazApiConfig, instanceToken: string, webhookUrl: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/webhook`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        events: [
          'connection',
          'messages',
          'messages_update',
          'history',
          'chats',
          'contacts',
          'groups',
          'presence',
          'call',
        ],
      }),
    })
    return res.json()
  },

  async logoutInstance(config: UazApiConfig, instanceToken: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/logout`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'token': instanceToken,
      },
    })
    return res.json()
  },

  async deleteInstance(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/delete`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'admintoken': config.adminToken,
      },
      body: JSON.stringify({
        name: instanceName,
      }),
    })
    return res.json()
  },

  async fetchInstances(config: UazApiConfig) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/fetchInstances`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'admintoken': config.adminToken,
      },
    })
    return res.json()
  },

  async getConnectionState(config: UazApiConfig, instanceToken: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/status`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'token': instanceToken,
      },
    })
    return res.json()
  },

  async getQrCode(config: UazApiConfig, instanceToken: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/connect`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'token': instanceToken,
      },
    })
    return res.json()
  },

  async sendText(config: UazApiConfig, instanceToken: string, number: string, text: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/message/sendText`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': instanceToken,
      },
      body: JSON.stringify({
        number,
        text,
      }),
    })
    return res.json()
  }
}
