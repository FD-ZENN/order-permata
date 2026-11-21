<?php

class AdminController extends BaseController
{
    protected string $table = 'admins';
    protected array $fillable = ['username', 'password', 'name', 'is_active'];
    protected array $required = ['username', 'password', 'name'];
    protected ?string $orderBy = 'created_at DESC';

    protected function beforeCreate(array &$input): void
    {
        if (!empty($input['password'])) {
            $input['password'] = password_hash((string) $input['password'], PASSWORD_BCRYPT);
        }
    }

    protected function beforeUpdate(array &$input, array $existing): void
    {
        if (array_key_exists('password', $input)) {
            if ($input['password'] === '' || $input['password'] === null) {
                // Password dikosongkan berarti tidak ingin diubah
                unset($input['password']);
            } else {
                $input['password'] = password_hash((string) $input['password'], PASSWORD_BCRYPT);
            }
        }
    }

    protected function sanitizeRow(array $row): array
    {
        unset($row['password']);
        return $row;
    }
}
