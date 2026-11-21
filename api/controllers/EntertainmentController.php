<?php

class EntertainmentController extends BaseController
{
    protected string $table = 'entertainment';
    protected array $fillable = ['order_id', 'name', 'type', 'description', 'sort_order'];
    protected array $required = ['order_id', 'name'];
    protected ?string $orderBy = 'sort_order ASC';
}
