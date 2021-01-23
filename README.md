<br />
<br />

<p>
<img src="https://near.org/wp-content/themes/near-19/assets/img/neue/logo.svg?t=1600963474" width="200">
</p>

<br />
<br />

# Vue Near
A vue 3 plugin for NEAR API. Useful for building dapps with NEAR blockchain quickly! This plugin combines the simplicity of [near-api-js](https://github.com/near/near-api-js/) to the convenience of vuejs methods available to all components.

## Installation

### 1. Install Plugin
```bash
# yarn
yarn add vue-near

# npm
npm install vue-near
```

### 2. Add CDN NEAR-API-JS

Add this script tag to your `index.html` file.
```
<script src="https://cdn.jsdelivr.net/gh/nearprotocol/near-api-js/dist/near-api-js.js" ></script>
```


### 3. Import

```js
// In main.js
import { createApp } from 'vue'
import VueNear from "vue-near"

const app = createApp(App)

app.use(VueNear, {
  // Needs the environment for the correct RPC to use
  env: process.env.NODE_ENV || 'development',
  config: {
    appTite: 'Cool dApp',
    contractName: 'cool_dapp.testnet',
  },
})

app.mount('#app')
```

## Usage

```js
// this.$near -- has all the bootstrapped near-api-js methods
// in addition to some quick helpers
// ALL methods available within any component
console.log(this.$near.user.accountId)
// -> 'cool_user.testnet'

// Sign in a user, via web wallet
this.$near.loginAccount()

// logout a user
this.$near.logoutAccount()

// get a contract with executable methods
this.$near.getContractInstance('cool_contract.testnet', {
  changeMethods: ['set_something'],
  viewMethods: ['get_something'],
})
```

## API methods

### `$near`

This is the base global instance of near-api-js, upon application start this instance utilizes a fully configured connection, allowing immediate use within all components.
For more information on what is available (not documented below) see [full docs here](https://near.github.io/near-api-js/). Specific methods [available here](https://near.github.io/near-api-js/classes/_near_.near.html)

```js
await this.$near.sendTokens(10, 'from_account.testnet', 'to_account.testnet')
```

### `loginAccount()`

Sign in a user, via web wallet. Will redirect user to the near web wallet configured based on environment. Upon success, user will land back on this application with permissions. This will continue to use any user data that is already logged in (see localStorage) if available.

```js
this.$near.loginAccount()
```

### `logoutAccount()`

Fully removes user data in localStorage as well as within all $near instances.

```js
this.$near.logoutAccount()
```

### `getContractInstance()`

Load a contract with all available methods for easy interaction with the blockchain deployed contract. Configure which account the contract is available at, and provide method names for each type, then contract methods can be executed with returned instance.

```js
const contract = this.$near.getContractInstance('cool_contract.testnet', {
  changeMethods: ['set_something'],
  viewMethods: ['get_something'],
})

// call method
await contract.set_something()

// view method
await contrat.get_something()
```

### `loadAccount()`

Load the user account into $near instance, making all helper methods and details available.

```js
this.$near.loadAccount()

// Now user info and methods are available:
this.$near.user

// Where you can access things like:
this.near.user.accountId
this.near.user.balance
```

### `$nearInit`

In rare cases, you may want to fully re-instantiate the base $near instance. Using this method will fully clear any/all data configured within $near and re-bind a new near-api-js class, configured with built env variables.

## Tests

I would love help writing tests. ❤️

## License

[MIT](LICENSE.txt) License

----

### Refill My ☕️?

If you feel this helped you in some way, you can tip `tjtc.near`
