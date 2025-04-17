// ./src/api/user/controllers/auth.ts

import { factories } from "@strapi/strapi";
import { Context } from "koa";

export default factories.createCoreController(
  "plugin::users-permissions.user",
  ({ strapi }) => ({
    async login(ctx: Context) {
      const { identifier, password } = ctx.request.body;

      if (!identifier || !password) {
        return ctx.badRequest(
          "Identifier (email/username) and password are required"
        );
      }

      try {
        // Tìm user dựa trên email hoặc username
        const users = await strapi.documents("plugin::users-permissions.user").findMany({
          filters: {
            $or: [{ email: identifier }, { username: identifier }],
          },
          populate: ["role"], // Nếu bạn cần thông tin role
        });

        const user = users[0];

        if (!user) {
          return ctx.badRequest("Invalid identifier or password");
        }

        // Kiểm tra mật khẩu
        const validPassword = await strapi
          .service("plugin::users-permissions.user")
          .validatePassword(password, user.password);

        if (!validPassword) {
          return ctx.badRequest("Invalid identifier or password");
        }

        // Tạo JWT token
        const token = strapi.service("plugin::users-permissions.jwt").issue({
          id: user.id,
        });

        // Trả về thông tin user mở rộng
        return ctx.send({
          jwt: token,
          user,
        });
      } catch (error) {
        return ctx.badRequest("Login failed", { error });
      }
    },

    async register(ctx: Context) {
      const { email, username, password, phone, address } = ctx.request.body;

      // Kiểm tra các trường bắt buộc
      if (!email || !username || !password) {
        return ctx.badRequest("Email, Username, and Password are required");
      }

      // Kiểm tra xem email, username hoặc phone đã tồn tại chưa
      const existingUsers = await strapi.documents("plugin::users-permissions.user").findMany({
        filters: {
          $or: [{ email: email }, { username: username }, { phone: phone }],
        },
        limit: 1,
      });

      if (existingUsers && existingUsers.length > 0) {
        const user = existingUsers[0];
        if (user.email === email) {
          return ctx.badRequest("Email already exists");
        }
        if (user.username === username) {
          return ctx.badRequest("Username already exists");
        }
        if (phone && user.phone === phone) {
          return ctx.badRequest("Phone already exists");
        }
      }

      // Lấy role mặc định của người dùng (authenticated)
      // Lấy role mặc định của người dùng (authenticated)
      const result = await strapi.documents("plugin::users-permissions.role").findMany({
        filters: { type: "authenticated" },
      });

      // Ép kiểu an toàn
      const defaultRoles = Array.isArray(result) ? result : [result];

      if (!defaultRoles || defaultRoles.length === 0) {
        return ctx.badRequest("Default role not found");
      }

      try {
        const newUser = await strapi.documents("plugin::users-permissions.user").create({
          data: {
            email,
            username,
            password,
            phone,
            address,
            role: defaultRoles[0].id,
          },
        });

        return ctx.send({ user: newUser });
      } catch (error) {
        return ctx.badRequest("User registration failed", { error });
      }
    },
  })
);
