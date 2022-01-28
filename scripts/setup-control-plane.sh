#!/bin/sh
curl -L -O https://docs.projectcalico.org/manifests/calico.yaml

kubeadm config print init-defaults | tee ClusterConfiguration.yaml

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=InitConfiguration).localAPIEndpoint.advertiseAddress' \
    $(hostname -I)

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=InitConfiguration).nodeRegistration.name' \
    $(hostname)

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=InitConfiguration).nodeRegistration.criSocket' \
    '/var/run/containerd/containerd.sock'

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=ClusterConfiguration).controlPlaneEndPoint' \
    $(hostname)

dasel put document -p yaml -d json -f ClusterConfiguration.yaml \
    -s '(kind=ClusterConfiguration).apiServer.certSANs' \
    '["$(hostname)", "$(hostname -I)"]'

cat <<EOF | tee -a ClusterConfiguration.yaml
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
EOF

kubeadm init --config ClusterConfiguration.yaml --cri-socket /var/run/containerd/containerd.sock

mkdir -p $HOME/.kube

cp -i /etc/kubernetes/admin.conf $HOME/.kube/config

chown $(id -u):$(id -g) $HOME/.kube/config

kubectl apply -f calico.yaml