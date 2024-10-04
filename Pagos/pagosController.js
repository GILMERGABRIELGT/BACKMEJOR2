const { sql, poolPromise } = require("../db");
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const jwt = require('jsonwebtoken');

// Clave secreta definida directamente en el código (solo para pruebas y desarrollo)
const secretKey = 'f1d3ff8443297732862df21dc4e57262e1a8b5a8d2f7b9e1f6a9c7e5b3d9f8a1';

// Función para encriptar datos sensibles
const encrypt = (text) => {
    if (!secretKey || secretKey.length !== 64) {
        throw new Error('Clave secreta no está definida o no tiene el tamaño correcto.');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

// Función para desencriptar datos
const decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
};

// Controlador para obtener todas las tarjetas
const getAllCards = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM Tarjetas");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controlador para agregar una tarjeta
const addCard = async (req, res) => {
    const { NumeroTarjeta, FechaExpiracion, CVC, Titular } = req.body;

    try {
        // Obtener el UsuarioID del token JWT
        const UsuarioID = req.user.userID;  // Asegúrate de que 'userID' es el campo correcto en el token JWT

        // Validar que todos los campos estén presentes
        if (!UsuarioID || !NumeroTarjeta || !FechaExpiracion || !CVC || !Titular) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        const pool = await poolPromise;

        // Encriptar datos sensibles
        const encryptedCardNumber = encrypt(NumeroTarjeta);
        const encryptedCVC = encrypt(CVC);

        // Insertar la tarjeta en la base de datos
        const query = `
            INSERT INTO Tarjetas (UsuarioID, NumeroTarjeta, FechaExpiracion, CVC, Titular, iv)
            VALUES (@UsuarioID, @NumeroTarjeta, @FechaExpiracion, @CVC, @Titular, @iv);
            SELECT SCOPE_IDENTITY() AS TarjetaID;
        `;

        const inputs = [
            { name: 'UsuarioID', type: sql.Int, value: UsuarioID },  // Usar el UsuarioID desde el token
            { name: 'NumeroTarjeta', type: sql.NVarChar, value: encryptedCardNumber.content },
            { name: 'FechaExpiracion', type: sql.NVarChar, value: FechaExpiracion },
            { name: 'CVC', type: sql.NVarChar, value: encryptedCVC.content },
            { name: 'Titular', type: sql.NVarChar, value: Titular },
            { name: 'iv', type: sql.NVarChar, value: encryptedCardNumber.iv }
        ];

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));

        const result = await request.query(query);

        res.status(201).json({
            message: "Tarjeta registrada exitosamente",
            TarjetaID: result.recordset[0].TarjetaID
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al agregar la tarjeta.' });
    }
};

// Controlador para actualizar una tarjeta
const updateCard = async (req, res) => {
    const { id } = req.params;
    const { NumeroTarjeta, FechaExpiracion, CVC, Titular } = req.body;

    try {
        const pool = await poolPromise;

        // Encriptar datos sensibles
        const encryptedCardNumber = encrypt(NumeroTarjeta);
        const encryptedCVC = encrypt(CVC);

        const query = `
            UPDATE Tarjetas
            SET NumeroTarjeta = @NumeroTarjeta, FechaExpiracion = @FechaExpiracion, CVC = @CVC, Titular = @Titular
            WHERE TarjetaID = @id;
            SELECT * FROM Tarjetas WHERE TarjetaID = @id;
        `;

        const inputs = [
            { name: 'id', type: sql.Int, value: id },
            { name: 'NumeroTarjeta', type: sql.NVarChar, value: encryptedCardNumber.content },
            { name: 'FechaExpiracion', type: sql.NVarChar, value: FechaExpiracion },
            { name: 'CVC', type: sql.NVarChar, value: encryptedCVC.content },
            { name: 'Titular', type: sql.NVarChar, value: Titular }
        ];

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Tarjeta no encontrada" });
        }

        res.status(200).json({
            message: "Tarjeta actualizada correctamente",
            card: result.recordset[0],
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controlador para eliminar una tarjeta
const deleteCard = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Tarjetas WHERE TarjetaID = @id');

        res.status(200).json({ message: 'Tarjeta eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Controlador para obtener una tarjeta desencriptada por ID de usuario
const getCardByUser = async (req, res) => {
    const { UsuarioID } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UsuarioID', sql.Int, UsuarioID)
            .query('SELECT * FROM Tarjetas WHERE UsuarioID = @UsuarioID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Tarjeta no encontrada' });
        }

        // Desencriptar los datos de la tarjeta
        const encryptedCardNumber = {
            iv: result.recordset[0].iv,
            content: result.recordset[0].NumeroTarjeta
        };
        const decryptedCardNumber = decrypt(encryptedCardNumber);

        const encryptedCVC = {
            iv: result.recordset[0].iv,
            content: result.recordset[0].CVC
        };
        const decryptedCVC = decrypt(encryptedCVC);

        res.json({
            TarjetaID: result.recordset[0].TarjetaID,
            NumeroTarjeta: decryptedCardNumber,
            FechaExpiracion: result.recordset[0].FechaExpiracion,
            CVC: decryptedCVC,
            Titular: result.recordset[0].Titular
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllCards,
    addCard,
    updateCard,
    deleteCard,
    getCardByUser
};
