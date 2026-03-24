const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const authCtrl      = require('../controllers/authController');
const inventoryCtrl = require('../controllers/inventoryController');
const risCtrl       = require('../controllers/risController');
const userCtrl      = require('../controllers/userController');
const reportCtrl    = require('../controllers/reportController');
const { auth, requireRole } = require('../middleware/auth');

const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg','.jpeg','.png','.gif','.webp','.xlsx','.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`));
  },
});

router.post('/auth/login',    authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.get ('/auth/me',       auth, authCtrl.me);

router.get('/inventory',                  inventoryCtrl.getAll);
router.get('/inventory/categories',       inventoryCtrl.getCategories);
router.get('/inventory/template',         auth, requireRole('admin_administrative','superadmin'), inventoryCtrl.downloadTemplate);
router.get('/inventory/:id',              inventoryCtrl.getOne);
router.post('/inventory',                 auth, requireRole('admin_administrative','superadmin'), upload.single('image'), inventoryCtrl.create);
router.put ('/inventory/:id',             auth, requireRole('admin_administrative','superadmin'), upload.single('image'), inventoryCtrl.update);
router.delete('/inventory/:id',           auth, requireRole('admin_administrative','superadmin'), inventoryCtrl.remove);
router.post('/inventory/parse-excel',     auth, requireRole('admin_administrative','superadmin'), upload.single('file'),  inventoryCtrl.parseExcel);
router.post('/inventory/confirm-upload',  auth, requireRole('admin_administrative','superadmin'), inventoryCtrl.confirmUpload);

router.post('/ris/guest',                 risCtrl.saveGuest);
router.post('/ris/claim',                 auth, risCtrl.claimRIS);
router.get ('/ris/my',                    auth, requireRole('employee'), risCtrl.getMyRIS);
router.post('/ris/direct',                auth, requireRole('employee'), risCtrl.createDirect);
router.get ('/ris/inbox',                 auth, requireRole('admin','admin_administrative','superadmin'), risCtrl.getAdminInbox);
router.get ('/ris/:id',                   auth, risCtrl.getOne);
router.put ('/ris/:id',                   auth, requireRole('employee'), risCtrl.updateRIS);
router.post('/ris/:id/send',              auth, requireRole('employee'), risCtrl.sendRIS);
router.put ('/ris/:id/mark-received',     auth, requireRole('admin','admin_administrative','superadmin'), risCtrl.markReceived);
router.put ('/ris/:id/assign-ris-no',     auth, requireRole('admin_administrative','superadmin'), risCtrl.assignRISNo);

router.get ('/users/departments',   userCtrl.getDepartments);
router.get ('/users/stats',         auth, requireRole('superadmin'), userCtrl.getSystemStats);
router.get ('/users/admins',        auth, requireRole('superadmin'), userCtrl.getAllAdmins);
router.get ('/users/employees',     auth, requireRole('superadmin','admin','admin_administrative'), userCtrl.getAllEmployees);
router.post('/users/admin',         auth, requireRole('superadmin'), userCtrl.createAdmin);
router.put ('/users/:id',           auth, requireRole('superadmin'), userCtrl.updateUser);
router.put ('/users/:id/toggle',    auth, requireRole('superadmin'), userCtrl.toggleActive);
router.delete('/users/:id',         auth, requireRole('superadmin'), userCtrl.deleteUser);

router.post('/reports/generate',    auth, requireRole('admin','admin_administrative'), reportCtrl.generate);
router.get ('/reports',             auth, requireRole('admin','admin_administrative'), reportCtrl.getAll);
router.get ('/reports/:id/excel',   auth, requireRole('admin','admin_administrative'), reportCtrl.downloadExcel);
router.get ('/reports/:id',         auth, requireRole('admin','admin_administrative'), reportCtrl.getOne);

module.exports = router;
