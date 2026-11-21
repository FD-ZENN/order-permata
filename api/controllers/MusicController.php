<?php

class MusicController extends BaseController
{
    protected string $table = 'music';
    protected array $fillable = ['order_id', 'title', 'artist', 'audio_url', 'autoplay', 'loop', 'sort_order'];
    protected array $required = ['order_id', 'title', 'audio_url'];
    protected ?string $orderBy = 'sort_order ASC';
}
