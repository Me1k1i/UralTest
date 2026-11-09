const readSetting = (value) => typeof value === 'string' ? value.trim() : '';

export function getFavoritConfig(env = process.env) {
  return {
    apiKey: readSetting(env.FAVORIT_API_KEY),
    apiUrl: readSetting(env.FAVORIT_API_URL),
  };
}
