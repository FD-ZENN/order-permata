<?php

class GalleryController extends BaseController
{
    protected string $table = 'galleries';
    protected array $fillable = ['order_id', 'photo_url', 'caption', 'is_cover', 'sort_order'];
    protected array $required = ['order_id', 'photo_url'];
    protected ?string $orderBy = 'sort_order ASC';
}
