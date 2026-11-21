<?php

abstract class BaseController
{
    protected PDO $db;

    /** Nama tabel di database */
    protected string $table;

    /** Primary key tabel */
    protected string $primaryKey = 'id';

    /** Kolom yang boleh diisi lewat request (mass-assignment whitelist) */
    protected array $fillable = [];

    /** Kolom wajib diisi saat create (POST) */
    protected array $required = [];

    /** Validasi enum: ['nama_kolom' => ['nilai_a', 'nilai_b', ...]] */
    protected array $enums = [];

    /** ORDER BY default */
    protected ?string $orderBy = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // ------------------------------------------------------------------
    // GET /resource  — list + filter + pagination + sorting
    // ------------------------------------------------------------------
    public function index(): void
    {
        $where  = [];
        $params = [];

        foreach ($_GET as $key => $value) {
            if (in_array($key, ['page', 'limit', 'sort', 'dir'], true)) {
                continue;
            }
            if (in_array($key, $this->fillable, true) || $key === $this->primaryKey) {
                $where[]          = "`$key` = :filter_$key";
                $params[":filter_$key"] = $value;
            }
        }

        $sql = "SELECT * FROM `{$this->table}`";
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        // Hitung total data (untuk pagination) sebelum LIMIT ditambahkan
        $countSql  = "SELECT COUNT(*) AS total FROM `{$this->table}`" . ($where ? ' WHERE ' . implode(' AND ', $where) : '');
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetch()['total'];

        // Sorting
        $orderBy = $this->orderBy;
        if (!empty($_GET['sort'])) {
            $col = preg_replace('/[^a-zA-Z0-9_]/', '', (string) $_GET['sort']);
            $dir = (isset($_GET['dir']) && strtolower((string) $_GET['dir']) === 'desc') ? 'DESC' : 'ASC';
            if (in_array($col, array_merge($this->fillable, ['created_at', 'updated_at']), true)) {
                $orderBy = "`$col` $dir";
            }
        }
        if ($orderBy) {
            $sql .= " ORDER BY $orderBy";
        }

        // Pagination
        $page   = max(1, (int) ($_GET['page'] ?? 1));
        $limit  = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $sql .= ' LIMIT :limit OFFSET :offset';

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        Response::success([
            'items'      => $this->sanitizeRows($rows),
            'pagination' => [
                'page'        => $page,
                'limit'       => $limit,
                'total'       => $total,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ]);
    }

    // ------------------------------------------------------------------
    // GET /resource/{id}
    // ------------------------------------------------------------------
    public function show(string $id): void
    {
        $row = $this->find($id);
        if (!$row) {
            Response::error('Data tidak ditemukan', 404);
        }

        Response::success($this->sanitizeRow($row));
    }

    // ------------------------------------------------------------------
    // POST /resource
    // ------------------------------------------------------------------
    public function store(): void
    {
        $input = $this->getInput();

        $this->beforeCreate($input);

        $errors = $this->validate($input, false);
        if ($errors) {
            Response::error('Validasi gagal', 422, $errors);
        }

        $data = $this->filterFillable($input);
        if (empty($data)) {
            Response::error('Tidak ada data valid untuk disimpan', 422);
        }

        $data[$this->primaryKey] = generate_uuid();

        $columns      = array_keys($data);
        $placeholders = array_map(fn ($c) => ":$c", $columns);

        $sql  = "INSERT INTO `{$this->table}` (`" . implode('`, `', $columns) . '`) ';
        $sql .= 'VALUES (' . implode(', ', $placeholders) . ')';

        $stmt = $this->db->prepare($sql);
        foreach ($data as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }

        try {
            $stmt->execute();
        } catch (PDOException $e) {
            $this->handleDbError($e);
        }

        $row = $this->find($data[$this->primaryKey]);

        // Auto-recompile static invitation jika ada penambahan data pada resource terkait order
        $orderId = null;
        if ($this->table === 'orders') {
            $orderId = $data[$this->primaryKey];
        } elseif (!empty($data['order_id'])) {
            $orderId = $data['order_id'];
        }

        if ($orderId) {
            try {
                InvitationCompiler::build($this->db, $orderId);
            } catch (\Throwable $e) {
                error_log("Auto-recompile store error for order {$orderId}: " . $e->getMessage());
            }
        }

        Response::success($this->sanitizeRow($row), 'Data berhasil ditambahkan', 201);
    }

    // ------------------------------------------------------------------
    // PUT/PATCH /resource/{id}
    // ------------------------------------------------------------------
    public function update(string $id): void
    {
        $existing = $this->find($id);
        if (!$existing) {
            Response::error('Data tidak ditemukan', 404);
        }

        $input = $this->getInput();

        $this->beforeUpdate($input, $existing);

        $errors = $this->validate($input, true);
        if ($errors) {
            Response::error('Validasi gagal', 422, $errors);
        }

        $data = $this->filterFillable($input);
        if (empty($data)) {
            Response::error('Tidak ada field valid untuk diupdate', 422);
        }

        $set = implode(', ', array_map(fn ($c) => "`$c` = :$c", array_keys($data)));
        $sql = "UPDATE `{$this->table}` SET $set WHERE `{$this->primaryKey}` = :id";

        $stmt = $this->db->prepare($sql);
        foreach ($data as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':id', $id);

        try {
            $stmt->execute();
        } catch (PDOException $e) {
            $this->handleDbError($e);
        }

        $row = $this->find($id);

        // Auto-recompile static invitation jika ada perubahan data pada resource terkait order
        $orderId = null;
        if ($this->table === 'orders') {
            $orderId = $id;
        } elseif (!empty($existing['order_id'])) {
            $orderId = $existing['order_id'];
        }

        if ($orderId) {
            try {
                InvitationCompiler::build($this->db, $orderId);
            } catch (\Throwable $e) {
                error_log("Auto-recompile error for order {$orderId}: " . $e->getMessage());
            }
        }

        Response::success($this->sanitizeRow($row), 'Data berhasil diupdate');
    }

    // ------------------------------------------------------------------
    // DELETE /resource/{id}
    // ------------------------------------------------------------------
    public function destroy(string $id): void
    {
        $existing = $this->find($id);
        if (!$existing) {
            Response::error('Data tidak ditemukan', 404);
        }

        $stmt = $this->db->prepare("DELETE FROM `{$this->table}` WHERE `{$this->primaryKey}` = :id");

        try {
            $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            $this->handleDbError($e);
        }

        // Auto-recompile static invitation jika ada penghapusan data pada resource terkait order
        $orderId = null;
        if ($this->table === 'orders') {
            $orderId = $id;
        } elseif (!empty($existing['order_id'])) {
            $orderId = $existing['order_id'];
        }

        if ($orderId) {
            try {
                // Hanya build jika order masih ada di database
                $checkStmt = $this->db->prepare("SELECT id FROM orders WHERE id = :oid LIMIT 1");
                $checkStmt->execute([':oid' => $orderId]);
                if ($checkStmt->fetch()) {
                    InvitationCompiler::build($this->db, $orderId);
                }
            } catch (\Throwable $e) {
                error_log("Auto-recompile destroy error for order {$orderId}: " . $e->getMessage());
            }
        }

        Response::success(null, 'Data berhasil dihapus');
    }

    // ------------------------------------------------------------------
    // Helper internal
    // ------------------------------------------------------------------

    protected function find(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM `{$this->table}` WHERE `{$this->primaryKey}` = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    protected function getInput(): array
    {
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return $_POST ?: [];
        }

        return $data;
    }

    protected function filterFillable(array $input): array
    {
        $data = [];
        foreach ($this->fillable as $field) {
            if (array_key_exists($field, $input)) {
                $value        = $input[$field];
                $data[$field] = ($value === '') ? null : $value;
            }
        }

        return $data;
    }

    protected function validate(array $input, bool $isUpdate): array
    {
        $errors = [];

        if (!$isUpdate) {
            foreach ($this->required as $field) {
                if (!array_key_exists($field, $input) || $input[$field] === '' || $input[$field] === null) {
                    $errors[$field] = "Field {$field} wajib diisi";
                }
            }
        }

        foreach ($this->enums as $field => $allowed) {
            if (array_key_exists($field, $input) && $input[$field] !== null && $input[$field] !== '') {
                if (!in_array($input[$field], $allowed, true)) {
                    $errors[$field] = "Nilai {$field} harus salah satu dari: " . implode(', ', $allowed);
                }
            }
        }

        return $errors;
    }

    protected function handleDbError(PDOException $e): void
    {
        $code = $e->errorInfo[1] ?? null;

        if ($code === 1062) {
            Response::error('Data duplikat, kombinasi data ini sudah ada', 409);
        }
        if ($code === 1452) {
            Response::error('Referensi data tidak valid (relasi/foreign key tidak ditemukan)', 422);
        }
        if ($code === 1451) {
            Response::error('Data tidak bisa dihapus/diubah karena masih dipakai oleh data lain', 409);
        }

        Response::error('Terjadi kesalahan pada database', 500, APP_DEBUG ? $e->getMessage() : null);
    }

    /** Hook: mutasi $input sebelum divalidasi & disimpan saat create */
    protected function beforeCreate(array &$input): void
    {
    }

    /** Hook: mutasi $input sebelum divalidasi & disimpan saat update */
    protected function beforeUpdate(array &$input, array $existing): void
    {
    }

    /** Hook: bersihkan data sebelum dikirim ke client (mis. sembunyikan password) */
    protected function sanitizeRow(array $row): array
    {
        return $row;
    }

    protected function sanitizeRows(array $rows): array
    {
        return array_map(fn ($row) => $this->sanitizeRow($row), $rows);
    }
}
