{ project ? import ./nix { } }:

let

  pkgs = project.pkgs;
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    git
    nodejs-16_x
    commitizen
    (yarn.override { nodejs = nodejs-16_x; })
  ] ++ builtins.attrValues project.devTools;


  shellHook = ''
    git pull
    yarn install
    ${project.ci.pre-commit-check.shellHook}
  '';
}
