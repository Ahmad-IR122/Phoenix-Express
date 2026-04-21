'use strict';

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');

router.post('/', walletController.createWallet);
router.get('/', walletController.getAllWallets);
router.get('/:id', walletController.findWalletById);
router.put('/:id', walletController.updateWallet);
router.delete('/:id', walletController.deleteWallet);

module.exports = router;
