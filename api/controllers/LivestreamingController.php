<?php

class LivestreamingController extends BaseController
{
    protected string $table = 'livestreaming';
    protected array $fillable = ['order_id', 'title', 'youtube_url', 'stream_start', 'stream_end', 'is_active'];
    protected array $required = ['order_id', 'youtube_url'];
    protected ?string $orderBy = 'created_at DESC';
}
