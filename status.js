Bun.serve({
    port: 80,
    fetch(req) {
        return new Response(
/*html*/`
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Instrument Status</title>
    <style>
        table {
	        border-collapse: collapse;
        }
        table td {
            padding: 15px;
            width: 100px;
            text-align: center;
        }
        table thead th {
            background-color: #54585d;
            color: #ffffff;
            font-weight: bold;
            border: 1px solid #54585d;
        }
        table tbody td.htmx-added {
            opacity: 1;
        }
        table tbody td {
            color: #636363;
            opacity: 0.2;
            transition-delay: 1s;
            transition: opacity 2s ease-out;
            border: 1px solid #dddfe1;
        }
        table tbody tr {
            background-color: #f9fafb;
        }
        table tbody tr:nth-child(odd) {
            background-color: #ffffff;
        }
    </style>
</head>
<body>
    <script src="https://unpkg.com/htmx.org@1.9.5"></script>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Port</th>
                <th>Status</th>
                <th>Busy</th>
                <th>Wavelength</th>
                <th>Channel</th>
                <th>IL</th>
                <th>RL</th>
            </tr>
        </thead>
        <tbody>
            <tr hx-post="http://localhost:7004/status" hx-trigger="load, every 200ms" hx-swap="innerHTML" hx-request='"noHeaders":"true"'></tr>
            <tr hx-post="http://localhost:7099/status" hx-trigger="load, every 200ms" hx-swap="innerHTML" hx-request='"noHeaders":"true"'></tr>
            <tr hx-post="http://localhost:7104/status" hx-trigger="load, every 200ms" hx-swap="innerHTML" hx-request='"noHeaders":"true"'></tr>
            <tr hx-post="http://localhost:7105/status" hx-trigger="load, every 200ms" hx-swap="innerHTML" hx-request='"noHeaders":"true"'></tr>
            <tr hx-post="http://localhost:7137/status" hx-trigger="load, every 200ms" hx-swap="innerHTML" hx-request='"noHeaders":"true"'></tr>
            <tr hx-post="http://localhost:7224/status" hx-trigger="load, every 200ms" hx-swap="innerHTML" hx-request='"noHeaders":"true"'></tr>
            <tr hx-post="http://localhost:7226/status" hx-trigger="load, every 200ms" hx-swap="innerHTML" hx-request='"noHeaders":"true"'></tr>
        </tbody>
    </table>
</body>
`
, {
    headers: {
      "Content-Type": "text/html",
    },});
    },
  });