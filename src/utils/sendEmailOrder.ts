"use strict";

/**
 * Gửi email đơn hàng theo trạng thái thanh toán.
 * @param {Object} params
 * @param {Object} params.strapi - Instance Strapi để sử dụng plugin email.
 * @param {string} params.email - Email khách hàng.
 * @param {string} params.orderId - Mã đơn hàng (orderId) như DH...
 * @param {Array} params.orderItemsData - Danh sách các OrderItem.
 * @param {number} params.totalPrice - Tổng số tiền của đơn hàng.
 * @param {string} params.phoneNumber - Số điện thoại.
 * @param {string} params.address - Địa chỉ giao hàng.
 * @param {string} [params.note] - Ghi chú đơn hàng.
 * @param {("success" | "fail")} params.type - Loại email gửi: success hoặc fail.
 */
module.exports = async function sendEmailOrder({
  strapi,
  email,
  orderId,
  orderItemsData,
  totalPrice,
  phoneNumber,
  address,
  note,
  type,
}) {
  const purchaseDate = new Date().toLocaleString("vi-VN");
  let subject = "";
  let emailHtml = "";

  if (type === "success") {
    subject = "Thanh toán đơn hàng thành công";
    emailHtml = `
  <div style="font-family: sans-serif; background-color: #f4f7f9; padding: 40px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #007BFF; padding: 20px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Kawin</h1>
        <p style="margin: 5px 0 0; color: #e0e0e0; font-size: 14px;">Thông báo thanh toán thành công</p>
      </div>
      <div style="padding: 20px;">
        <p style="font-size: 16px; color: #333;">Xin chào quý khách,</p>
        <p style="font-size: 15px; color: #555;">Đơn hàng <strong>${orderId}</strong> của bạn đã được thanh toán thành công.</p>
        <p><strong>Ngày mua:</strong> ${purchaseDate}</p>
        <p><strong>Số điện thoại:</strong> ${phoneNumber}</p>
        <p><strong>Địa chỉ giao hàng:</strong> ${address}</p>
        <p><strong>Ghi chú:</strong> ${note || "Không có"}</p>

        <h3 style="margin-top: 30px;">Chi tiết sản phẩm:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f2f2f2; text-align: left;">
              <th style="padding: 10px;">#</th>
              <th style="padding: 10px;">Hình ảnh</th>
              <th style="padding: 10px;">Tên sản phẩm</th>
              <th style="padding: 10px;">Kích thước</th>
              <th style="padding: 10px;">Số lượng</th>
              <th style="padding: 10px;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsData
              .map(
                (item, index) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px;">${index + 1}</td>
                  <td style="padding: 10px;">
                    <img src="${item.image}" alt="${item.name}" width="60" style="border-radius: 6px;" />
                  </td>
                  <td style="padding: 10px;">${item.name}</td>
                    <td style="padding: 10px;">${item.size}</td>
                  <td style="padding: 10px;">${item.quantity}</td>
                  <td style="padding: 10px; color: #d32f2f;"><strong>${item.price.toLocaleString()}đ</strong></td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <p style="margin-top: 20px;"><strong>Tổng tiền:</strong> <span style="color: #28a745; font-size: 16px;">${totalPrice.toLocaleString()}đ</span></p>
      </div>
      <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 14px; color: #777;">
        <p>Cảm ơn bạn đã tin tưởng Kawin.</p>
        <p>&copy; ${new Date().getFullYear()} Kawin Team</p>
      </div>
    </div>
  </div>
`;
  } else if (type === "fail") {
    subject = "Thanh toán đơn hàng thất bại";
    emailHtml = `
  <div style="font-family: sans-serif; background-color: #fcebea; padding: 40px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #d32f2f; padding: 20px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Kawin</h1>
        <p style="margin: 5px 0 0; color: #f8d7da; font-size: 14px;">Thông báo thanh toán <strong>thất bại</strong></p>
      </div>
      <div style="padding: 20px;">
        <p style="font-size: 16px; color: #333;">Xin chào quý khách,</p>
        <p style="font-size: 15px; color: #555;">Đơn hàng <strong>${orderId}</strong> của bạn <span style="color: #d32f2f;"><strong>không được thanh toán thành công</strong></span>.</p>
        <p><strong>Ngày mua:</strong> ${purchaseDate}</p>
        <p><strong>Số điện thoại:</strong> ${phoneNumber}</p>
        <p><strong>Địa chỉ giao hàng:</strong> ${address}</p>
        <p><strong>Ghi chú:</strong> ${note || "Không có"}</p>

        <h3 style="margin-top: 30px; color: #d32f2f;">Chi tiết sản phẩm:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f8d7da; text-align: left;">
              <th style="padding: 10px;">#</th>
              <th style="padding: 10px;">Hình ảnh</th>
              <th style="padding: 10px;">Tên sản phẩm</th>
               <th style="padding: 10px;">Kích thước</th>
              <th style="padding: 10px;">Số lượng</th>
              <th style="padding: 10px;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsData
              .map(
                (item, index) => `
                <tr style="border-bottom: 1px solid #f3bcbc;">
                  <td style="padding: 10px;">${index + 1}</td>
                  <td style="padding: 10px;">
                    <img src="${item.image}" alt="${item.name}" width="60" style="border-radius: 6px;" />
                  </td>
                  <td style="padding: 10px;">${item.name}</td>
                    <td style="padding: 10px;">${item.size}</td>
                  <td style="padding: 10px;">${item.quantity}</td>
                  <td style="padding: 10px; color: #d32f2f;"><strong>${item.price.toLocaleString()}đ</strong></td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <p style="margin-top: 20px;"><strong>Tổng tiền:</strong> <span style="color: #d32f2f; font-size: 16px;">${totalPrice.toLocaleString()}đ</span></p>
        <p style="margin-top: 10px; color: #d32f2f;">Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
      </div>
      <div style="background-color: #f8d7da; padding: 15px; text-align: center; font-size: 14px; color: #721c24;">
        <p>Chúng tôi xin lỗi vì sự bất tiện này.</p>
        <p>&copy; ${new Date().getFullYear()} Kawin Team</p>
      </div>
    </div>
  </div>
`;
  }

  await strapi
    .plugin("email")
    .service("email")
    .send({
      to: email,
      from: process.env.MY_EMAIL_ADDRESS || "no-reply@example.com",
      subject,
      html: emailHtml,
    });
};
