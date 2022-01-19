import * as pulumi from "@pulumi/pulumi";
import * as os from "@pulumi/openstack";
import * as command from "@pulumi/command";

import { setupControlPlane } from "./steps/control-plane";
import { setupNode } from "./steps/node";

let config = new pulumi.Config();

let cloud = config.require("cloud");
let region = config.require("region");
let keyPair = config.get("keyPair");
let user = config.get("user") || "ubuntu";

const provider = new os.Provider("openstack", {
    cloud: cloud,
    region: region,
});

const controlPlane = setupControlPlane(provider, {
    name: "kube-cp-1",
    region: region,
    user: user,
    keyPair: keyPair
});

const node1Instance = setupNode(provider, {
    name: "kube-node-1",
    region: region,
    user: user,
    keyPair: keyPair,
    controlPlane: controlPlane.instance,
    certificateKey: controlPlane.certificateKey,
    token: controlPlane.token
});

const node2Instance = setupNode(provider, {
    name: "kube-node-2",
    region: region,
    user: user,
    keyPair: keyPair,
    controlPlane: controlPlane.instance,
    certificateKey: controlPlane.certificateKey,
    token: controlPlane.token
});

exports.ipAddress = controlPlane.instance.accessIpV4;