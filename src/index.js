// Optional config, can be passed in before plugin install:
// {
//   appTitle: '',
//   contractName: '',
// }
export function getConfig(env, options = {}) {
  const config = {
    ...options,
    appTitle: options.appTitle || 'NEAR',
    contractName: options.contractName || 'test.near',
  }

  switch (env) {
    case 'production':
    case 'mainnet':
      return {
        ...config,
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.near.org',
        explorerUrl: 'https://explorer.near.org',
        walletUrl: 'https://wallet.near.org',
        helperUrl: 'https://helper.mainnet.near.org'
      }
    case 'development':
    case 'testnet':
      return {
        ...config,
        networkId: 'default',
        nodeUrl: 'https://rpc.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org'
      }
    case 'betanet':
      return {
        ...config,
        networkId: 'betanet',
        nodeUrl: 'https://rpc.betanet.near.org',
        explorerUrl: 'https://explorer.betanet.near.org',
        walletUrl: 'https://wallet.betanet.near.org',
        helperUrl: 'https://helper.betanet.near.org'
      }
    case 'local':
      return {
        ...config,
        networkId: 'local',
        nodeUrl: 'http://localhost:3030',
        keyPath: `${process.env.HOME}/.near/validator_key.json`,
        walletUrl: 'http://localhost:4000/wallet',
      }
    case 'test':
    case 'ci':
      return {
        ...config,
        networkId: 'shared-test',
        nodeUrl: 'https://rpc.ci-testnet.near.org',
        masterAccount: 'test.near'
      }
    case 'ci-betanet':
      return {
        ...config,
        networkId: 'shared-test-staging',
        nodeUrl: 'https://rpc.ci-betanet.near.org',
        masterAccount: 'test.near'
      }
    default:
      throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}

// string to uint array
// REF: https://coolaj86.com/articles/unicode-string-to-a-utf-8-typed-array-buffer-in-javascript/
function unicodeStringToTypedArray(s) {
  const escstr = encodeURIComponent(s)
  const binstr = escstr.replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1)
  });
  let ua = new Uint8Array(binstr.length)
  Array.prototype.forEach.call(binstr, function (ch, i) {
    ua[i] = ch.charCodeAt(0)
  })
  return ua
}

export class VueNear {
  constructor(env, config) {
    // loading via CDN, requires adding this line to index.html:
    // <script src="https://cdn.jsdelivr.net/gh/nearprotocol/near-api-js/dist/near-api-js.js" ></script>
    if (!window || !window.nearApi) return
    this.nearApi = { ...window.nearApi }
    this.config = getConfig(env, config)
    this.near = null
    this.keystore = null
    this.user = null

    return this
  }
  
  async loadNearProvider() {
    this.keystore = new this.nearApi.keyStores.BrowserLocalStorageKeyStore(window.localStorage, 'nearlib:keystore:')
    this.near = await this.nearApi.connect(Object.assign({ deps: { keyStore: this.keystore } }, this.config))
    return this
  }

  async loadAccount() {
    // Needed to access wallet
    this.walletConnection = new this.nearApi.WalletConnection(this.near)
    this.user = new this.nearApi.WalletAccount(this.near)

    if (this.walletConnection.getAccountId()) {
      this.user.accountId = this.walletConnection.getAccountId()
      this.user.balance = (await this.walletConnection.account().state()).amount
    }

    return this
  }

  async loginAccount() {
    if (this.user && this.user.isSignedIn()) return this.user
    const appTitle = this.config.appTitle || 'NEAR'
    await this.user.requestSignIn(this.config.contractName, appTitle)

    // returns full access key?! CAREFUL!
    // await this.user.requestSignIn('')

    // re-load account
    return this.loadAccount()
  }

  async logoutAccount() {
    this.walletConnection = new this.nearApi.WalletConnection(this.near)
    this.user = new this.nearApi.WalletAccount(this.near)
    await this.user.signOut()

    this.keystore = null
    this.user = null
  }

  async getContractInstance(contract_id, abiMethods) {
    if (!this.user || !this.user.accountId) return
    const account = this.walletConnection.account()
    const abi = {
      changeMethods: [],
      viewMethods: [],
      ...abiMethods,
    }

    // Sender is the account ID to initialize transactions.
    return new this.nearApi.Contract(
      account,
      contract_id,
      { ...abi, sender: account.accountId }
    )
  }

  async getSignedPayload(message) {
    if (!this.user || !this.user.accountId) return
    const { secretKey } = await this.keystore.getKey(this.config.networkId, this.user.accountId)
    if (!secretKey) return
    const pair = new this.nearApi.utils.key_pair.KeyPairEd25519(secretKey)
    if (!pair) return
    const parsed = unicodeStringToTypedArray(message)
    const sig = await pair.sign(parsed)

    return {
      message,
      signature: sig.signature,
      publicKey: sig.publicKey.data,
    }
  }

  signedPayloadToString(payload) {
    const payloadStr = `${payload.message}|${payload.signature.toString()}|${payload.publicKey.toString()}`
    return this.nearApi.utils.serialize.base_encode(payloadStr)
  }

}

// Register NEAR plugin with Vue
export default {
  install: async (app, { env, config }) => {
    // Add global context and methods for NEAR
    app.config.globalProperties.$near = await new VueNear(env, config)
    await app.config.globalProperties.$near.loadNearProvider()
    await app.config.globalProperties.$near.loadAccount()

    app.provide('$user', app.config.globalProperties.$near.user)

    // enable re-instantiation
    app.config.globalProperties.$nearInit = () => {
      return new VueNear(env, config).loadNearProvider()
    }

    // TODO: Add convenience methods for VUEX
  },
}