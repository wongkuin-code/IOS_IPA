import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCOUNTS: 'fanqie_accounts',
  CURRENT_ACCOUNT: 'fanqie_current_account',
  BINDINGS: 'fanqie_bindings',
};

export async function getAccounts() {
  try {
    const v = await AsyncStorage.getItem(KEYS.ACCOUNTS);
    return v ? JSON.parse(v) : {};
  } catch { return {}; }
}

export async function saveAccount(name, cookie, csrf) {
  const accounts = await getAccounts();
  accounts[name] = { cookie, csrf, updated_at: new Date().toISOString() };
  await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  await AsyncStorage.setItem(KEYS.CURRENT_ACCOUNT, name);
}

export async function getCurrentAccount() {
  try {
    return await AsyncStorage.getItem(KEYS.CURRENT_ACCOUNT) || '小号';
  } catch { return '小号'; }
}

export async function getCredentials(accountName) {
  const accounts = await getAccounts();
  const a = accounts[accountName];
  return a ? { cookie: a.cookie || '', csrf: a.csrf || '' } : { cookie: '', csrf: '' };
}

export async function listAccounts() {
  const accounts = await getAccounts();
  return Object.keys(accounts);
}

export async function deleteAccount(name) {
  const accounts = await getAccounts();
  delete accounts[name];
  await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  const cur = await getCurrentAccount();
  if (cur === name) {
    const keys = Object.keys(accounts);
    await AsyncStorage.setItem(KEYS.CURRENT_ACCOUNT, keys[0] || '小号');
  }
}

export async function getBindings() {
  try {
    const v = await AsyncStorage.getItem(KEYS.BINDINGS);
    return v ? JSON.parse(v) : {};
  } catch { return {}; }
}

export async function saveBinding(localName, fanqieBookId, account) {
  const bindings = await getBindings();
  bindings[localName] = { fanqie_book_id: fanqieBookId, account, updated_at: new Date().toISOString() };
  await AsyncStorage.setItem(KEYS.BINDINGS, JSON.stringify(bindings));
}

export async function deleteBinding(localName) {
  const bindings = await getBindings();
  delete bindings[localName];
  await AsyncStorage.setItem(KEYS.BINDINGS, JSON.stringify(bindings));
}
