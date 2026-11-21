<?php

class TestimonialController extends BaseController
{
    protected string $table = 'testimonials';

    protected array $fillable = [
        'order_id', 'customer_name', 'content', 'rating',
        'photo_url', 'is_published', 'sort_order',
    ];

    protected array $required = ['customer_name', 'content'];

    protected ?string $orderBy = 'sort_order ASC, created_at DESC';

    protected function validate(array $input, bool $isUpdate): array
    {
        $errors = parent::validate($input, $isUpdate);

        if (array_key_exists('rating', $input) && $input['rating'] !== null && $input['rating'] !== '') {
            $rating = (int) $input['rating'];
            if ($rating < 1 || $rating > 5) {
                $errors['rating'] = 'Rating harus antara 1 sampai 5';
            }
        }

        return $errors;
    }
}
