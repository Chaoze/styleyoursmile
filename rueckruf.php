<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.styleyoursmile.ch');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$vorname      = htmlspecialchars(strip_tags(trim($input['vorname']      ?? '')));
$nachname     = htmlspecialchars(strip_tags(trim($input['nachname']     ?? '')));
$geburtsdatum = htmlspecialchars(strip_tags(trim($input['geburtsdatum'] ?? '')));
$tel          = htmlspecialchars(strip_tags(trim($input['tel']          ?? '')));
$zeit         = htmlspecialchars(strip_tags(trim($input['zeit']         ?? '')));
$chatHistory  = strip_tags(trim($input['chatHistory'] ?? ''));

if (empty($vorname) || empty($nachname) || empty($tel)) {
    http_response_code(400);
    echo json_encode(['error' => 'Pflichtfelder fehlen']);
    exit;
}

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

    $mail->Subject = 'Rückruf-Anfrage – StyleYourSmile';
    $mail->Body    = "Neue Rückruf-Anfrage via Praxis-Chat\n"
                   . "=====================================\n\n"
                   . "Vorname:       {$vorname}\n"
                   . "Nachname:      {$nachname}\n"
                   . "Geburtsdatum:  {$geburtsdatum}\n"
                   . "Telefon:       {$tel}\n"
                   . "Rückrufzeit:   {$zeit}\n\n"
                   . "--- Chatverlauf ---\n"
                   . $chatHistory . "\n";

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Senden fehlgeschlagen']);
}
