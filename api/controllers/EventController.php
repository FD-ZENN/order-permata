<?php

class EventController extends BaseController
{
    protected string $table = 'events';

    protected array $fillable = [
        'order_id', 'event_name', 'event_datetime', 'event_end',
        'venue_name', 'venue_address', 'google_maps_url', 'description', 'sort_order',
    ];

    protected array $required = ['order_id', 'event_name', 'event_datetime'];

    protected ?string $orderBy = 'sort_order ASC, event_datetime ASC';
}
