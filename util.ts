import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import * as pulumi from "@pulumi/pulumi"

function resolvePath(filePath: string) {
    if (filePath.startsWith("~")) {
        return filePath.replace("~", os.homedir());
    }

    return filePath;
}

export function readKeyFile(filePath: string): pulumi.Output<string> {
    const resolvedPath = resolvePath(filePath);

    const key = fs.readFileSync(resolvedPath, { encoding: 'utf8' });

    return pulumi.output(key);
}