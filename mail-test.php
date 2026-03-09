<?php
require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/smtp-config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);
$mail->SMTPDebug = 2;
$mail->Debugoutput = 'html';

try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress(MAIL_TO);
    $mail->Subject = 'Test Mail';
    $mail->Body    = 'Test von mail-test.php';

    $mail->send();
    echo '<p style="color:green;font-size:20px">✓ Mail gesendet!</p>';
} catch (Exception $e) {
    echo '<p style="color:red;font-size:20px">Fehler: ' . htmlspecialchars($mail->ErrorInfo) . '</p>';
}
