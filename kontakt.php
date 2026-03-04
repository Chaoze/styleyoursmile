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

$to          = 'info@styleyoursmile.ch';
$mailSubject = '=?UTF-8?B?' . base64_encode('Neue Anfrage – StyleYourSmile') . '?=';

$body = "Neue Kontaktanfrage von der Website\r\n"
      . "=====================================\r\n\r\n"
      . "Vorname:  {$firstName}\r\n"
      . "Nachname: {$lastName}\r\n"
      . "E-Mail:   {$email}\r\n"
      . "Telefon:  {$phone}\r\n"
      . "Betreff:  {$subjectLabel}\r\n\r\n"
      . "Nachricht:\r\n{$message}\r\n";

$headers = "From: anfrage@styleyoursmile.ch\r\n"
         . "Reply-To: {$email}\r\n"
         . "MIME-Version: 1.0\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

if (mail($to, $mailSubject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.']);
}
