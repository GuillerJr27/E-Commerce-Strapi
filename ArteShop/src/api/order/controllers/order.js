"use strict";
const stripe = require("stripe")(
    "sk_test_51Nswy2GU7NziFbVSNrXfYvOhrwSo1F98Vsx9KHI4FOk5u8M8k5uA7jXkThREX77AHvsZ7YZGHYXT1J55tOsggoOr00cc2oU7Lu"
);

function calcDiscountPrice(price, discount) {
    if (!discount) return price;

    const discountAmount = (price * discount) / 100;
    const result = price - discountAmount;

    return result.toFixed(2);
}
/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
    async paymentOrder(ctx) {
        const {token, products, userId, addressShipping} = ctx.request.body;

        let totalPayment = 0;
        products.forEach((product) => {
            const priceTemp = calcDiscountPrice(product.price, product.discount);
            totalPayment += Number(priceTemp) * product.quantity;
        });

        const charge = await stripe.charges.create({
            amount: Math.round(totalPayment * 100),
            currency: "usd",
            source: token,
            description: `User ID: ${userId}`,
        });

        const data = {
            products,
            user: userId,
            totalPayment,
            idPayment: charge.id,
            addressShipping,
        };

        const model = strapi.contentTypes["api::order.order"];
        const valiData = await strapi.entityValidator.validateEntityCreation(
            model,
            data
        );

        const entry = await strapi.db
           .query("api::order.order")
           .create({ data: valiData});

        return entry;
    },
}));
