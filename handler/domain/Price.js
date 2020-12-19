'use strict'
class Price {

    constructor(body) {
        this.itemCosts = body.itemCosts;
        this.shippingCosts = body.shipping.price;
        this.sizeAndWeight = body.sizeAndWeight
        this.fees = body.fees;
        this.benefit = body.benefit;
    }

    /**
     * Price = (item costs + shipping costs + listing fee + payment processing fee amount) / (1 - desired margin - PPF % - transaction fee %)
     * @returns {number}
     */
    calculatePriceWithMargin() {
        const desiredMargin = this.benefit.desiredMargin / 100;
        const costsAndFees = this.itemCosts + this.shippingCosts + this.fees.listingFee + this.fees.paymentProcessingFeeAmount;
        const percentage = 1 - this.fees.paymentProcessingFeePercentage - this.fees.transactionFeePercentage - desiredMargin
        const price = costsAndFees / percentage;

        return {
            price: Math.round(price),
            margin: desiredMargin,
            return: (price - costsAndFees) / costsAndFees,
            netProfit: price - costsAndFees
        }
    }

    /**
     * Price = ((desired return + 1) * (item costs + shipping costs + listing fee + payment processing fee amount)) / (1 - PPF % - transaction fee %) - desired return * (PPF % + transaction fee %)
     */
    calculatePriceWithReturn() {
        const desiredReturn = this.benefit.desiredReturn / 100;
        const costsAndFees = (this.itemCosts + this.shippingCosts + this.fees.listingFee + this.fees.paymentProcessingFeeAmount) * (desiredReturn + 1);
        const percentage = 1 - this.fees.paymentProcessingFeePercentage - this.fees.transactionFeePercentage - desiredReturn * (this.fees.paymentProcessingFeePercentage + this.fees.transactionFeePercentage)

        const price = costsAndFees / percentage;

        return {
            price: Math.round(price),
            margin: (price - costsAndFees) / price,
            return: desiredReturn,
            netProfit: price - costsAndFees
        }
    }

    /**
     * Calculate price for the same item but in different size.
     *
     * Price = similar item price * (w * h * d of new item) / (w * h * d of similar item)
     *
     * @returns {number}
     */
    calculatePriceWithDifferentSize(originalSizeAndWeight) {
        // new item costs = original item costs * new size / original size
        console.log(`old item costs ${this.itemCosts}`)
        this.itemCosts = this.itemCosts
            * (this.sizeAndWeight.w * this.sizeAndWeight.h * this.sizeAndWeight.d)
            / (originalSizeAndWeight.w * originalSizeAndWeight.h * originalSizeAndWeight.d);

        console.log(`new item costs ${this.itemCosts}`)

        const {price} = this.calculatePrice();

        console.log(`proportion calculated price ${JSON.stringify(price)} ${JSON.stringify(this.sizeAndWeight)}`)

        return price;
    }

    calculatePrice() {
        if (this.benefit.desiredNetProfit) {
            return this.calculatePriceWithNetProfit();
        } else if (this.benefit.desiredMargin) {
            return this.calculatePriceWithMargin();
        } else if (this.benefit.desiredReturn) {
            return this.calculatePriceWithReturn();
        } else {
            throw 'there is no margin/return/net profit specified';
        }
    }


    /**
     * Price = (desired net profit + item costs + shipping costs + listing fee + payment processing fee amount) / (1 - PPF % - transaction fee %)
     */
    calculatePriceWithNetProfit() {
        const desiredNetProfit = this.benefit.desiredNetProfit;
        const costsAndFees = this.itemCosts + this.shippingCosts + this.fees.listingFee + this.fees.paymentProcessingFeeAmount + desiredNetProfit;
        const percentage = 1 - this.fees.paymentProcessingFeePercentage - this.fees.transactionFeePercentage;

        const price = costsAndFees / percentage;

        return {
            price: Math.round(price),
            margin: desiredNetProfit / price,
            return: desiredNetProfit / costsAndFees,
            netProfit: desiredNetProfit
        }
    }

}

module.exports = Price