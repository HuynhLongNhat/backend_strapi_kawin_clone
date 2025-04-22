/**
 * product controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::product.product",
  ({ strapi }) => ({
    async find(ctx) {
      // Lấy tham số `query` từ URL
      const query = ctx.request.query.query as string;

      // Nếu có tham số `query`, thực hiện tìm kiếm
      if (query) {
        const products = await strapi
          .documents("api::product.product")
          .findMany({
            filters: {
              name: {
                $contains: query, // Case-insensitive search
              },
            },
            populate: {
              Image: true, // Lấy hình ảnh của sản phẩm (Đổi 'image' thành tên đúng trong database của bạn)
            },
            limit: 5,
          });

        return products;
      }

      // Nếu không có tham số `query`, trả về tất cả sản phẩm
      return super.find(ctx);
    },
  })
);
