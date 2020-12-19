'use strict';

const Price = require('./domain/Price');
const {sendError, wrapResponse} = require('./utils');
const {decorateBody, fetchProportions} = require('./fetcher')

/**
 * Retrieve all the possible proportions for current painting and make up the price for them proportionally
 * and return results back
 */
const calculateItemProportions = async (body) => {
    if (body.sizeAndWeight.calculateProportion) {
        // fetch from dynamodb
        const proportions = await fetchProportions(body);
        return proportions ?
            proportions.map(item => {
                return {
                    size: `${item.sizeAndWeight.w}x${item.sizeAndWeight.h}x${body.sizeAndWeight.d} ${body.sizeAndWeight.unitOfMeasure}`,
                    price: new Price(item).calculatePriceWithDifferentSize(body.sizeAndWeight)
                };
            })
            :
            null;
    }
}

/**
 * Common method to calculate price
 */
const calculate = async (event) => {
    try {
        const body = await decorateBody(event);
        const price = new Price(body);
        const result = price.calculatePrice();

        const proportion = await calculateItemProportions(body)
        return wrapResponse(body, result, proportion);
    } catch (e) {
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