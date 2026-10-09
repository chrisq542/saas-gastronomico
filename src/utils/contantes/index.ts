
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "afxapp.cl";
export const ROOT_URL = process.env.NODE_ENV === "production"
    ? `${ROOT_DOMAIN}`
    : `localhost:3000`;