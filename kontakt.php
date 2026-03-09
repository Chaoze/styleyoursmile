<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.styleyoursmile.ch');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Eingaben bereinigen
$firstName = htmlspecialchars(strip_tags(trim($_POST['firstName'] ?? '')));
$lastName  = htmlspecialchars(strip_tags(trim($_POST['lastName']  ?? '')));
$email     = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone     = htmlspecialchars(strip_tags(trim($_POST['phone']   ?? '')));
$subject   = htmlspecialchars(strip_tags(trim($_POST['subject'] ?? '')));
$message   = htmlspecialchars(strip_tags(trim($_POST['message'] ?? '')));

// Pflichtfelder prüfen
if (empty($firstName) || empty($lastName) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Bitte Vorname, Nachname und gültige E-Mail angeben.']);
    exit;
}

// Betreff-Label übersetzen
$subjectLabels = [
    'termin'       => 'Terminanfrage',
    'zweitmeinung' => 'Zweitmeinung',
    'invisalign'   => 'Invisalign-Beratung',
    'implantate'   => 'Implantat-Beratung',
    'notfall'      => 'Notfall',
    'andere'       => 'Andere Anfrage',
];
$subjectLabel = $subjectLabels[$subject] ?? ($subject ?: '—');

// PHPMailer via SMTP
require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/smtp-config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

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
    $mail->addReplyTo($email, "{$firstName} {$lastName}");

    $mail->Subject = 'Neue Anfrage – StyleYourSmile';
    $mail->Body    = "Neue Kontaktanfrage von der Website\n"
                   . "=====================================\n\n"
                   . "Vorname:  {$firstName}\n"
                   . "Nachname: {$lastName}\n"
                   . "E-Mail:   {$email}\n"
                   . "Telefon:  {$phone}\n"
                   . "Betreff:  {$subjectLabel}\n\n"
                   . "Nachricht:\n{$message}\n";

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.']);
}
