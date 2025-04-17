export default {
  routes: [
    {
      method: "POST",
      path: "/auth/local/register",
      handler: "auth.register",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/local",
      handler: "auth.login",
      config: {
        auth: false,
      },
    },
  ],
};
