'use strict';

const Price = require('./domain/Price');
const {sendError, wrapResponse} = require('./utils');
const {decorateBody, fetchProportions} = require('./fetcher')

const calculateItemProportions = async (body) => {
    if (body.sizeAndWeight.calculateProportion) {
        // fetch from dynamodb
        const proportions = await fetchProportions(body);
        return proportions ? proportions.map(item => {
            console.log(`item ${JSON.stringify(item)}`);
            const result = {
                size: `${item.sizeAndWeight.w}x${item.sizeAndWeight.h}x${body.sizeAndWeight.d} ${body.sizeAndWeight.unitOfMeasure}`,
                price: new Price(item).calculatePriceWithDifferentSize(body.sizeAndWeight)
            };
            console.log(`result ${JSON.stringify(result)}`);

            return result;
        }) : null;
    }
}

const calculate = async (event) => {
    try {
        const body = await decorateBody(event);
        const price = new Price(body);
        const result = price.calculatePrice();

        console.log(`calculated price ${result}`)

        const proportion = await calculateItemProportions(body)
        return wrapResponse(body, result, proportion);
    } catch (e) {
        console.log(e);
        return sendError(e);
    }
}

module.exports.priceWithMargin = async event => {
    return await calculate(event);
};

module.exports.priceWithReturn = async event => {
    return await calculate(event);
};

module.exports.priceWithNetProfit = async event => {
    return await calculate(event);
};