export interface UazApiConfig {
  baseUrl: string
  adminToken: string
}

export const uazapi = {
  async createInstance(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/create`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.adminToken,
      },
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
      }),
    })
    return res.json()
  },

  async setWebhook(config: UazApiConfig, instanceName: string, webhookUrl: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/webhook/set/${instanceName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.adminToken,
      },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhook_by_events: false,
        events: [
          "MESSAGES_UPSERT",
          "MESSAGES_UPDATE",
          "MESSAGES_DELETE",
          "SEND_MESSAGE",
          "CONNECTION_UPDATE",
          "PRESENCE_UPDATE",
          "QRCODE_UPDATED",
          "CALL_UPSERT",
        ],
      }),
    })
    return res.json()
  },

  async setSettings(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/settings/set/${instanceName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.adminToken,
      },
      body: JSON.stringify({
        rejectCall: false,
        groupsIgnore: false,
        alwaysOnline: false,
        readMessages: true,
        readStatus: true,
        syncFullHistory: false,
      }),
    })
    return res.json()
  },

  async logoutInstance(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/logout/${instanceName}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': config.adminToken,
      },
    })
    return res.json()
  },

  async deleteInstance(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/delete/${instanceName}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': config.adminToken,
      },
    })
    return res.json()
  },

  async fetchInstances(config: UazApiConfig) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/fetchInstances`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.adminToken,
      },
    })
    return res.json()
  },

  async getConnectionState(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/connectionState/${instanceName}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.adminToken,
      },
    })
    return res.json()
  },

  async getQrCode(config: UazApiConfig, instanceName: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/instance/connect/${instanceName}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.adminToken,
      },
    })
    return res.json()
  },

  async sendText(config: UazApiConfig, instanceName: string, number: string, text: string) {
    const url = `${config.baseUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.adminToken,
      },
      body: JSON.stringify({
        number,
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: false,
        },
        textMessage: {
          text,
        },
      }),
    })
    return res.json()
  }
}
