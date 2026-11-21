<?php

class LoveStoryController extends BaseController
{
    protected string $table = 'love_stories';
    protected array $fillable = ['order_id', 'title', 'content', 'photo_url', 'story_date', 'sort_order'];
    protected array $required = ['order_id', 'title'];
    protected ?string $orderBy = 'sort_order ASC';
}
