<?php
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");

    // TODO: switch to using database or mailto
    $time_fmt = 'Y-m-d-H-i-s-v';
    $delay = 20;

    $time = new DateTime();
    $time->setTimezone(new DateTimeZone('GMT'));
    $time_string = $time->format($time_fmt);

    $message_dir = join(DIRECTORY_SEPARATOR,
        [__DIR__, "..", "messages"]
    );
    $message_filename = $message_dir . DIRECTORY_SEPARATOR . $time_string . ".json";
    $throttle_filename = $message_dir . DIRECTORY_SEPARATOR . ".throttle";
    $errors = [];

    if (file_exists($throttle_filename)) {
        $delay_string = '+' . $delay . ' seconds';
        $last_update_string = file_get_contents($throttle_filename);
        $last_update = Datetime::createFromFormat($time_fmt, $last_update_string);
        $throttle_time = $last_update->modify($delay_string);
        if ($time < $throttle_time) {
            header("Retry-After: 20");
            http_response_code(503);
            http_send_data(json_encode(["status" => "retry", "message" => "Server busy."]));
            exit();
        }
    }

    $name = $_REQUEST['name'];
    $email = $_REQUEST['email'];
    $message = $_REQUEST['message'];
    $received = $_SERVER['REQUEST_TIME_FLOAT'];

    $data = [
        "name" => $name,
        "email" => $email,
        "message" => $message,
        "time" => $time_string,
    ];

    if (! file_put_contents($throttle_filename, $time_string))
    {
        $errors[] = "Unable to update timestamp file in message spool.";
    }
    else if (! file_put_contents($message_filename, json_encode($data)))
    {
        $errors[] = "Unable to write message to message spool.";
    }

    if (count($errors) == 0) {
        http_response_code(200);
        print json_encode([
            "ok" => true,
            "data" => $data
        ]);
    }
    else {
        http_response_code(500);
        print json_encode([
            "ok" => false,
            "data" => $data,
            "errors" => $errors,
        ]);
    }
?>