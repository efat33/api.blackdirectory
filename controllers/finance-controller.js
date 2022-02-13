const dotenv = require("dotenv");
dotenv.config();

const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const { validationResult } = require("express-validator");
const commonfn = require('../utils/common');
const FinanceModel = require('../models/finance-model');

class FinanceController {
    newFinance = async (req, res, next) => {
        const finance = await FinanceModel.createFinance(req.body);
        
        if (finance.status !== 200) {
            throw new AppError(403, "403_unknownError")
        };

        new AppSuccess(res, 200, "200_added", { 'entity': 'entity_finance' }, finance);
    }

    updateFinance = async (req, res, next) => {
        const getFinanceResult = await FinanceModel.getSingleFinance({ 'id': req.params.finance_id });

        if (Object.keys(getFinanceResult).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        const finance = getFinanceResult[0];

        if (!finance) {
            throw new AppError(403, "403_unknownError");
        }

        const result = await FinanceModel.updateFinance(req.params.finance_id, req.body);

        if (result) {
            new AppSuccess(res, 200, "200_updated", { 'entity': 'entity_finance' }, result);
        }
        else {
            throw new AppError(403, "403_unknownError");
        }
    }

    getFinance = async (req, res, next) => {
        const result = await FinanceModel.getFinance(req.body, req.body.page, req.body.limit);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_finance' }, result);
    };

    getSingleFinance = async (req, res, next) => {
        let body = {};

        if (isNaN(req.params.finance_id)) {
            body = { 'slug': req.params.finance_id }
        } else {
            body = { 'id': req.params.finance_id }
        }

        const result = await FinanceModel.getSingleFinance(body);

        new AppSuccess(res, 200, "200_detailFound", { 'entity': 'entity_finance' }, result);
    };

    deleteFinance = async (req, res, next) => {
        const result = await FinanceModel.getSingleFinance({ 'id': req.params.finance_id });

        if (Object.keys(result).length === 0) {
            throw new AppError(403, "403_unknownError")
        };

        await FinanceModel.deleteFinance(req.params.finance_id);

        new AppSuccess(res, 200, "200_deleted", { 'entity': 'entity_finance' });
    };

    
}

module.exports = new FinanceController();

