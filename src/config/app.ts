export interface IConfig {
  environment: string;
  namespace: string;
}

export const appConfig: IConfig = {
  environment: process.env.NODE_ENV || "local",
  namespace: process.env.NAMESPACE || "com.arnoldtanuwijaya.atm",
};