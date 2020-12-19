'use strict'
const AWS = require('aws-sdk');
const AWS_DEPLOY_REGION = process.env.AWS_DEPLOY_REGION;
AWS.config.update({region: AWS_DEPLOY_REGION});
const dynamoDb = new AWS.DynamoDB.DocumentClient({api_version: '2012-08-10'});

const dynamoDbGet = async (parametersToQuery) => {
    return await dynamoDb.query(
        parametersToQuery
    ).promise();
}

const sortDimensionsInDescOrder = (body) => {
    return [body.sizeAndWeight.w, body.sizeAndWeight.h, body.sizeAndWeight.d].sort((a, b) => b - a)
}

/**
 * Retrieve delivery profile from DynamoDB using item dimensions (+ roughly 1.5 cm on top for packaging).
 * If delivery profile found, update shipping info with delivery price and carrier, otherwise throw exception
 *
 * @param body
 */
const fetchShipping = async body => {
    const dimensions = sortDimensionsInDescOrder(body);

    const params = {
        TableName: process.env.DELIVERY_PROFILES,
        IndexName: 'FromCountryAndWeightIndex',
        KeyConditionExpression: 'fromCountry = :fromCountry and weightFrom < :weight',
        FilterExpression: ':weight <= weightTo and w >= :w and h >= :h and d >= :d',
        ExpressionAttributeValues: {
            ':fromCountry': body.country,
            ':weight': body.sizeAndWeight.weight,
            // add 1.5 cm to involve packaging
            ':w': dimensions[0] + 1.5,
            ':h': dimensions[1] + 1.5,
            ':d': dimensions[2] + 1.5
        }
    };
    const deliveryProfiles = await dynamoDbGet(params);

    if (deliveryProfiles && deliveryProfiles.Items.length > 0) {
        body.shipping = {
            from: body.country,
            carrier: deliveryProfiles.Items[0].carrier,
            price: Math.max(deliveryProfiles.Items[0].price)
        }
    } else {
        throw `there is no delivery profile found for ${body.country} and ${JSON.stringify(body.sizeAndWeight)}`;
    }
}

/**
 * Retrieve Etsy fees by country. They are listing fee, payment processing fee % and amount, currency and transaction fee %
 * and then update fees field in body
 * @param body
 */
const fetchFees = async body => {
    const params = {
        TableName: process.env.FEES,
        IndexName: 'CountryIndex',
        KeyConditionExpression: 'country = :country',
        ExpressionAttributeValues: {
            ':country': body.country
        }
    };

    const fees = await dynamoDbGet(params);

    if (fees && fees.Items) {
        const fee = fees.Items[0]

        body.fees = {
            listingFee: fee.lf,
            paymentProcessingFeePercentage: fee.ppfPer,
            paymentProcessingFeeAmount: fee.ppfAmount,
            paymentProcessingFeeCurrency: fee.ppfCurrency,
            transactionFeePercentage: fee.tfPer
        };
    } else {
        throw `there is no fee found for ${body.country}`;
    }
}
