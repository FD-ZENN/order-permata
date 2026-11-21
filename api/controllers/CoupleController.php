<?php

class CoupleController extends BaseController
{
    protected string $table = 'couples';

    protected array $fillable = [
        'order_id', 'slug_url', 'cover_photo_url',
        'groom_name', 'groom_nickname', 'groom_father', 'groom_mother', 'groom_address', 'groom_photo_url',
        'bride_name', 'bride_nickname', 'bride_father', 'bride_mother', 'bride_address', 'bride_photo_url',
    ];

    protected array $required = ['order_id', 'slug_url', 'groom_name', 'bride_name'];

    protected ?string $orderBy = 'created_at DESC';
}
