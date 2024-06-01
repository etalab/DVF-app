FROM postgres:13.0

RUN \
  apt update && \
  # see https://github.com/debuerreotype/docker-debian-artifacts/issues/46
  touch /usr/share/man/man1/sh.distrib.1.gz && \
  apt upgrade -yy -q && \
  apt install -y wget sudo curl

RUN curl -sL https://deb.nodesource.com/setup_15.x | bash - && \
  apt-get install -y nodejs

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list && \
  sudo apt-get install -y yarn

RUN  apt clean autoclean && rm -rf /var/lib/apt/* /var/cache/apt/*

