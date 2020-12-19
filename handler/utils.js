const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

module.exports.wrapResponse = (body, result, proportion) => ({
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    },
    statusCode: 200,
    body: JSON.stringify(
        {
            country: body.shipping.from,
            size: `${body.sizeAndWeight.w}x${body.sizeAndWeight.h}x${body.sizeAndWeight.d} ${body.sizeAndWeight.unitOfMeasure}`,
            price: round(result.price),

            costsAndShipping: {
                itemCosts: body.itemCosts,
                shippingCosts: body.shipping.price,
                carrier: body.shipping.carrier
            },
            fees: {
                transactionFeePercentage: body.fees.transactionFeePercentage,
                paymentProcessingFeePercentage: body.fees.paymentProcessingFeePercentage,
                paymentProcessingFeeAmount: body.fees.paymentProcessingFeeAmount,
                listingFee: body.fees.listingFee,
            },
            benefit: {
                margin: round(result.margin),
                return: round(result['return']),
                netProfit: round(result.netProfit)
            },
            proportion: proportion ? proportion.map(p => {
                return {...p, price: round(p.price)}
            }) : null
        },
        null,
        2
    )
});

module.exports.sendError = (e) => ({
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
    },
    statusCode: 400,
    body: JSON.stringify(
        {
            error: e
        },
        null,
        2
    )
});