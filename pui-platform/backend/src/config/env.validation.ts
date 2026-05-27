import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  RFC_INSTITUCION: Joi.string().required(),
  URL_BASE: Joi.string().uri().required(),
  CLAVE_PUI_LOGIN: Joi.string().min(16).max(20).required(),
  CLAVE_WEBHOOK: Joi.string().min(16).max(20).required(),
  CLAVE_BIOMETRICOS: Joi.string().base64().required(),

  PUI_BASE_URL: Joi.string().uri().required(),
  PUI_ORIGIN: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION_SECONDS: Joi.number().default(3600),

  PANEL_JWT_SECRET: Joi.string().min(32).required(),
  PANEL_JWT_EXPIRATION_SECONDS: Joi.number().default(28800),
  PANEL_ORIGIN: Joi.string().uri().required(),

  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),

  BUSQUEDA_CONTINUA_CRON: Joi.string().default('0 * * * *'),

  TLS_CERT_PATH: Joi.string().required(),
  TLS_KEY_PATH: Joi.string().required(),

  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('production'),
});
