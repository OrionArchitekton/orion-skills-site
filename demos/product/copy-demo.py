"""Copy one public skill into temporary demonstration directories only."""
from pathlib import Path
from tempfile import TemporaryDirectory
import argparse,shutil,hashlib,json
parser=argparse.ArgumentParser();parser.add_argument('skill_source',type=Path);a=parser.parse_args()
assert (a.skill_source/'SKILL.md').is_file()
def copy_missing(source,target):
 if target.exists():return 'preserved'
 shutil.copytree(source,target);return 'copied'
with TemporaryDirectory(prefix='skill-copy-demo-') as temporary:
 target=Path(temporary)/'skills'/a.skill_source.name;target.parent.mkdir()
 assert copy_missing(a.skill_source,target)=='copied'
 source=(a.skill_source/'SKILL.md').read_bytes();observed=(target/'SKILL.md').read_bytes();assert source==observed
 assert copy_missing(a.skill_source,target)=='preserved'
 assert (target/'SKILL.md').read_bytes()==observed
 print(json.dumps({'skill':a.skill_source.name,'source':'v0.6.0','skill_md_present':True,'same_sha256_as_source':hashlib.sha256(observed).hexdigest(),'existing_destination_preserved':True,'active_agent_settings_changed':False}))
