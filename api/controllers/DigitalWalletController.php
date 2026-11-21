<?php

class DigitalWalletController extends BaseController
{
    protected string $table = 'digital_wallets';

    protected array $fillable = [
        'order_id', 'wallet_type', 'bank_name', 'account_number',
        'account_holder', 'qr_code_url', 'is_active',
    ];

    protected array $required = ['order_id', 'wallet_type', 'account_holder'];

    protected array $enums = [
        'wallet_type' => ['bank', 'gopay', 'ovo', 'dana', 'shopeepay', 'other'],
    ];

    protected ?string $orderBy = 'created_at DESC';
}
