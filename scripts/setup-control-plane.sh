#!/bin/sh

sudo kubeadm config print init-defaults | tee ClusterConfiguration.yaml

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=InitConfiguration).localAPIEndpoint.advertiseAddress' \
    $(hostname -I | awk -F ' ' '{print $1}')

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=InitConfiguration).nodeRegistration.name' \
    $(hostname)

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=InitConfiguration).nodeRegistration.criSocket' \
    '/var/run/containerd/containerd.sock'

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=ClusterConfiguration).controlPlaneEndPoint' \
    $(hostname)

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=ClusterConfiguration).apiServer.certSANs.[]' \
    $(hostname)

dasel put string -p yaml -f ClusterConfiguration.yaml \
    -s '(kind=ClusterConfiguration).apiServer.certSANs.[]' \
    $(hostname -I | awk -F ' ' '{print $1}')

cat <<EOF | tee -a ClusterConfiguration.yaml
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
EOF

sudo kubeadm init --config ClusterConfiguration.yaml

mkdir -p $HOME/.kube

sudo cp -f /etc/kubernetes/admin.conf $HOME/.kube/config

sudo chown $(id -u):$(id -g) $HOME/.kube/config

# install CNI
curl -L -O https://docs.projectcalico.org/manifests/calico.yaml

kubectl apply -f calico.yaml