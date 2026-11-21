<?php

class ThemeController extends BaseController
{
    protected string $table = 'themes';
    protected array $fillable = ['name', 'preview_img', 'preview_url', 'category', 'is_active'];
    protected array $required = ['name', 'preview_img'];
    protected ?string $orderBy = 'created_at DESC';
}
